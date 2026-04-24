%% traffic_junction_model.m — SmartEVP+ Traffic Junction Simulation
% =========================================================================
% Models a 4-way signalised intersection under varying traffic load.
% Simulates vehicle queue dynamics and measures the impact of emergency
% preemption events on ambulance pass time and cross-traffic queue length.
%
% Key metrics produced:
%   - Ambulance delay with/without preemption
%   - Cross-traffic queue length over simulation period
%   - Phase timing efficiency comparison
%
% Run: traffic_junction_model
% Output: ./plots/01_junction_simulation.png
% =========================================================================

clear; clc; close all;

%% Simulation Parameters
SIM_DURATION_S   = 600;        % Simulation window (10 minutes)
DT               = 1;          % Time step (1 second)
N_STEPS          = SIM_DURATION_S / DT;

% Intersection phase timing (standard fixed-cycle baseline)
PHASE_RED_S      = 45;         % Red phase duration
PHASE_GREEN_S    = 30;         % Green phase duration
PHASE_AMBER_S    = 5;          % Amber phase duration
CYCLE_S          = PHASE_RED_S + PHASE_GREEN_S + PHASE_AMBER_S;

% Vehicle arrival rates (Poisson process)
ARRIVAL_RATE_N   = 0.35;       % vehicles/second on north lane
ARRIVAL_RATE_E   = 0.22;       % vehicles/second on east lane
ARRIVAL_RATE_S   = 0.30;       % vehicles/second on south lane
ARRIVAL_RATE_W   = 0.18;       % vehicles/second on west lane

% Service rate when green (vehicles discharged per second)
SERVICE_RATE     = 0.5;

% Ambulance arrives at T=180s, approaching from the west lane
AMBULANCE_T      = 180;
AMBULANCE_DIST_M = 650;        % initial distance from junction
AMBULANCE_SPD    = 12;         % m/s (~43 km/h in urban traffic)

% RL preemption trigger distance (metres)
RL_TRIGGER_M     = 580;        % from rl_inference.py output
FIXED_TRIGGER_M  = 500;        % baseline fixed-rule
RL_GREEN_HOLD_S  = 14;         % RL-computed green duration
FIXED_GREEN_HOLD = 10;         % fixed-rule green duration

rng(42);  % Reproducible simulation

%% ── Scenario A: Fixed-Rule Preemption ──────────────────────────────────
fprintf('Running Scenario A: Fixed-Rule Preemption...\n');

queue_ns_A = zeros(1, N_STEPS);  % North-South queue
queue_ew_A = zeros(1, N_STEPS);  % East-West queue
phase_A    = zeros(1, N_STEPS);  % 1=green NS, 0=green EW
amb_delay_A = 0;
amb_arrived_A = false;

q_ns = 0; q_ew = 0;
cycle_timer = 0;
current_phase = 1;          % 1 = NS green, 2 = EW green, 3 = amber
phase_timer = 0;
amb_pos = AMBULANCE_DIST_M;
amb_timer = 0;
preempt_A = false;
preempt_end_A = Inf;

for t = 1:N_STEPS
    time = t * DT;

    % Poisson vehicle arrivals
    arr_ns = poissrnd(ARRIVAL_RATE_N * DT + ARRIVAL_RATE_S * DT);
    arr_ew = poissrnd(ARRIVAL_RATE_E * DT + ARRIVAL_RATE_W * DT);
    q_ns = max(0, q_ns + arr_ns);
    q_ew = max(0, q_ew + arr_ew);

    % Ambulance motion
    if time >= AMBULANCE_T
        amb_timer = amb_timer + DT;
        if ~amb_arrived_A
            amb_pos = max(0, AMBULANCE_DIST_M - amb_timer * AMBULANCE_SPD);

            % Check fixed-rule trigger
            if amb_pos <= FIXED_TRIGGER_M && ~preempt_A
                preempt_A = true;
                preempt_end_A = time + FIXED_GREEN_HOLD;
                fprintf('  [A] Preemption triggered at t=%ds, dist=%.0fm\n', time, amb_pos);
            end

            if amb_pos == 0
                amb_delay_A = amb_timer;
                amb_arrived_A = true;
            end
        end
    end

    % Signal phase logic (with preemption override)
    if preempt_A && time < preempt_end_A
        current_phase = 1;  % Force green for ambulance (west = NS green)
        phase_timer = 0;
        discharge = min(q_ew, SERVICE_RATE * DT);   % EW stops
        q_ew = max(0, q_ew);
        q_ns = max(0, q_ns - SERVICE_RATE * DT);
    else
        phase_timer = phase_timer + DT;
        if current_phase == 1 && phase_timer >= PHASE_GREEN_S
            current_phase = 3; phase_timer = 0;
        elseif current_phase == 3 && phase_timer >= PHASE_AMBER_S
            current_phase = 2; phase_timer = 0;
        elseif current_phase == 2 && phase_timer >= PHASE_RED_S
            current_phase = 1; phase_timer = 0;
        end

        if current_phase == 1
            q_ns = max(0, q_ns - SERVICE_RATE * DT);
        elseif current_phase == 2
            q_ew = max(0, q_ew - SERVICE_RATE * DT);
        end
    end

    queue_ns_A(t) = q_ns;
    queue_ew_A(t) = q_ew;
    phase_A(t) = current_phase;
end

%% ── Scenario B: RL-Adaptive Preemption ─────────────────────────────────
fprintf('Running Scenario B: RL-Adaptive Preemption...\n');

queue_ns_B = zeros(1, N_STEPS);
queue_ew_B = zeros(1, N_STEPS);

q_ns = 0; q_ew = 0;
phase_timer = 0;
current_phase = 1;
amb_pos = AMBULANCE_DIST_M;
amb_timer = 0;
preempt_B = false;
preempt_end_B = Inf;
amb_delay_B = 0;
amb_arrived_B = false;

for t = 1:N_STEPS
    time = t * DT;

    arr_ns = poissrnd(ARRIVAL_RATE_N * DT + ARRIVAL_RATE_S * DT);
    arr_ew = poissrnd(ARRIVAL_RATE_E * DT + ARRIVAL_RATE_W * DT);
    q_ns = max(0, q_ns + arr_ns);
    q_ew = max(0, q_ew + arr_ew);

    if time >= AMBULANCE_T
        amb_timer = amb_timer + DT;
        if ~amb_arrived_B
            amb_pos = max(0, AMBULANCE_DIST_M - amb_timer * AMBULANCE_SPD);

            % RL trigger — smarter, triggers earlier
            if amb_pos <= RL_TRIGGER_M && ~preempt_B
                preempt_B = true;
                preempt_end_B = time + RL_GREEN_HOLD_S;
                fprintf('  [B] RL Preemption triggered at t=%ds, dist=%.0fm\n', time, amb_pos);
            end

            if amb_pos == 0
                amb_delay_B = amb_timer;
                amb_arrived_B = true;
            end
        end
    end

    if preempt_B && time < preempt_end_B
        current_phase = 1;
        phase_timer = 0;
        q_ns = max(0, q_ns - SERVICE_RATE * DT);
    else
        phase_timer = phase_timer + DT;
        if current_phase == 1 && phase_timer >= PHASE_GREEN_S
            current_phase = 3; phase_timer = 0;
        elseif current_phase == 3 && phase_timer >= PHASE_AMBER_S
            current_phase = 2; phase_timer = 0;
        elseif current_phase == 2 && phase_timer >= PHASE_RED_S
            current_phase = 1; phase_timer = 0;
        end

        if current_phase == 1
            q_ns = max(0, q_ns - SERVICE_RATE * DT);
        elseif current_phase == 2
            q_ew = max(0, q_ew - SERVICE_RATE * DT);
        end
    end

    queue_ns_B(t) = q_ns;
    queue_ew_B(t) = q_ew;
end

%% ── Results ─────────────────────────────────────────────────────────────
fprintf('\n=== RESULTS ===\n');
fprintf('Scenario A (Fixed Rule): Ambulance junction delay = %.1fs\n', amb_delay_A - (AMBULANCE_DIST_M/AMBULANCE_SPD));
fprintf('Scenario B (RL Adaptive): Ambulance junction delay = %.1fs\n', amb_delay_B - (AMBULANCE_DIST_M/AMBULANCE_SPD));

avg_queue_A = mean(queue_ew_A);
avg_queue_B = mean(queue_ew_B);
fprintf('Average cross-traffic queue [A]: %.1f vehicles\n', avg_queue_A);
fprintf('Average cross-traffic queue [B]: %.1f vehicles\n', avg_queue_B);
improvement = (avg_queue_A - avg_queue_B) / avg_queue_A * 100;
fprintf('Cross-traffic queue improvement: %.1f%%\n', improvement);

%% ── Plotting ─────────────────────────────────────────────────────────────
t_axis = (1:N_STEPS) * DT;

figure('Position', [100, 100, 1400, 700], 'Color', [0.08 0.08 0.12]);
ha = tight_subplot(2, 2, [0.12 0.08], [0.12 0.08], [0.08 0.05]);

dark_bg  = [0.08 0.08 0.12];
panel_bg = [0.11 0.11 0.17];
c_cyan   = [0.13 0.82 0.93];
c_red    = [1.00 0.23 0.23];
c_green  = [0.29 0.87 0.50];
c_amber  = [0.98 0.62 0.10];

% Plot 1: EW Queue comparison
axes(ha(1));
set(gca, 'Color', panel_bg, 'XColor', [0.7 0.7 0.7], 'YColor', [0.7 0.7 0.7], ...
    'GridColor', [0.2 0.2 0.3], 'GridAlpha', 0.5);
hold on; grid on;
plot(t_axis, queue_ew_A, 'Color', c_red,   'LineWidth', 1.5, 'DisplayName', 'Fixed Rule');
plot(t_axis, queue_ew_B, 'Color', c_green, 'LineWidth', 1.5, 'DisplayName', 'RL Adaptive');
xline(AMBULANCE_T, '--', 'Color', c_cyan, 'LineWidth', 1, 'Label', 'Amb. Arrives');
title('Cross-Traffic Queue (East-West)', 'Color', 'w', 'FontSize', 11, 'FontWeight', 'bold');
xlabel('Time (s)', 'Color', [0.7 0.7 0.7]);
ylabel('Vehicles in Queue', 'Color', [0.7 0.7 0.7]);
legend('Location', 'northwest', 'TextColor', 'w', 'Color', panel_bg);

% Plot 2: NS Queue comparison
axes(ha(2));
set(gca, 'Color', panel_bg, 'XColor', [0.7 0.7 0.7], 'YColor', [0.7 0.7 0.7], ...
    'GridColor', [0.2 0.2 0.3], 'GridAlpha', 0.5);
hold on; grid on;
plot(t_axis, queue_ns_A, 'Color', c_amber, 'LineWidth', 1.5, 'DisplayName', 'Fixed Rule');
plot(t_axis, queue_ns_B, 'Color', c_cyan,  'LineWidth', 1.5, 'DisplayName', 'RL Adaptive');
xline(AMBULANCE_T, '--', 'Color', [0.8 0.8 0.8], 'LineWidth', 1);
title('Ambulance Corridor Queue (N-S)', 'Color', 'w', 'FontSize', 11, 'FontWeight', 'bold');
xlabel('Time (s)', 'Color', [0.7 0.7 0.7]);
ylabel('Vehicles in Queue', 'Color', [0.7 0.7 0.7]);
legend('Location', 'northwest', 'TextColor', 'w', 'Color', panel_bg);

% Plot 3: Queue at preemption window
axes(ha(3));
set(gca, 'Color', panel_bg, 'XColor', [0.7 0.7 0.7], 'YColor', [0.7 0.7 0.7], ...
    'GridColor', [0.2 0.2 0.3], 'GridAlpha', 0.5);
hold on; grid on;
window = (AMBULANCE_T/DT - 30):(AMBULANCE_T/DT + 120);
window = max(1, min(window, N_STEPS));
plot(t_axis(window), queue_ew_A(window), 'Color', c_red,   'LineWidth', 2, 'DisplayName', 'Fixed Rule EW');
plot(t_axis(window), queue_ew_B(window), 'Color', c_green, 'LineWidth', 2, 'DisplayName', 'RL EW');
xline(AMBULANCE_T,                  '--', 'Color', c_cyan,  'LineWidth', 1.5, 'Label', 'Amb arrives');
xline(AMBULANCE_T + FIXED_GREEN_HOLD,':', 'Color', c_red,   'LineWidth', 1.2, 'Label', 'Fixed green end');
xline(AMBULANCE_T + RL_GREEN_HOLD_S, '-', 'Color', c_green, 'LineWidth', 1.2, 'Label', 'RL green end');
title('Preemption Window (Zoom)', 'Color', 'w', 'FontSize', 11, 'FontWeight', 'bold');
xlabel('Time (s)', 'Color', [0.7 0.7 0.7]);
ylabel('EW Queue', 'Color', [0.7 0.7 0.7]);
legend('Location', 'northwest', 'TextColor', 'w', 'Color', panel_bg);

% Plot 4: Summary bar chart
axes(ha(4));
set(gca, 'Color', panel_bg, 'XColor', [0.7 0.7 0.7], 'YColor', [0.7 0.7 0.7]);
metrics = [mean(queue_ew_A), mean(queue_ew_B); ...
           FIXED_GREEN_HOLD, RL_GREEN_HOLD_S; ...
           FIXED_TRIGGER_M/100, RL_TRIGGER_M/100];
bar_h = bar(metrics', 'grouped');
bar_h(1).FaceColor = c_red;
bar_h(2).FaceColor = c_green;
set(gca, 'XTickLabel', {'Avg Queue', 'Green Hold(s)', 'Trigger(x100m)'}, ...
    'TickLabelInterpreter', 'none', 'XColor', [0.7 0.7 0.7], 'YColor', [0.7 0.7 0.7]);
title('Fixed Rule vs RL Adaptive — Key Metrics', 'Color', 'w', 'FontSize', 11, 'FontWeight', 'bold');
legend({'Fixed Rule', 'RL Adaptive'}, 'TextColor', 'w', 'Color', panel_bg, 'Location', 'northeast');
ylabel('Value', 'Color', [0.7 0.7 0.7]);

sgtitle('SmartEVP+ Traffic Junction Simulation — Preemption Analysis', ...
    'Color', 'w', 'FontSize', 14, 'FontWeight', 'bold');

saveas(gcf, fullfile('plots', '01_junction_simulation.png'));
fprintf('\nPlot saved: plots/01_junction_simulation.png\n');

function ha = tight_subplot(Nh, Nw, gap, marg_h, marg_w)
    if nargin < 2, gap = 0.02; end
    if nargin < 3, marg_h = [0.05 0.05]; end
    if nargin < 4, marg_w = [0.05 0.05]; end
    if numel(gap) == 1, gap = [gap gap]; end
    if numel(marg_h) == 1, marg_h = [marg_h marg_h]; end
    if numel(marg_w) == 1, marg_w = [marg_w marg_w]; end
    axh = (1 - sum(marg_h) - (Nh-1)*gap(1)) / Nh;
    axw = (1 - sum(marg_w) - (Nw-1)*gap(2)) / Nw;
    ha = tight_subplot_inner(Nh, Nw, gap, marg_h, marg_w, axh, axw);
end

function ha = tight_subplot_inner(Nh, Nw, gap, marg_h, marg_w, axh, axw)
    ha = zeros(Nh*Nw, 1);
    ii = 0;
    for ih = 1:Nh
        for iw = 1:Nw
            ii = ii + 1;
            ax_x = marg_w(1) + (iw-1)*(axw + gap(2));
            ax_y = marg_h(1) + (Nh-ih)*(axh + gap(1));
            ha(ii) = axes('Position', [ax_x ax_y axw axh]);
        end
    end
end

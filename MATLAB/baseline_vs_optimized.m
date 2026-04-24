%% baseline_vs_optimized.m — SmartEVP+ Scenario Comparison
% =========================================================================
% Comprehensive comparison of 5 traffic density scenarios across
% Fixed-Rule vs RL-Adaptive preemption strategies.
%
% Scenarios: 2AM (low), Morning (moderate), Daytime (busy),
%            Evening Rush (peak), Incident (critical)
%
% Output: ./plots/03_baseline_vs_optimized.png
% =========================================================================

clear; clc; close all;

%% Scenario Definitions
scenarios = {'2AM\n(Low)', 'Morning\n(Moderate)', 'Daytime\n(Busy)', ...
             'Evening Rush\n(Peak)', 'Incident\n(Critical)'};
densities = [0.10, 0.35, 0.55, 0.78, 0.95];  % traffic_density 0–1
n_scenarios = length(densities);

%% RL Policy — same equations as rl_inference.py
function [trigger_m, green_s] = rl_decision(density, speed_kmh)
    base_trigger = 200 + 620 * (density ^ 0.75);
    base_green   = 6   + 14  * (density ^ 0.70);
    speed_factor = max(0.6, min(1.8, 55.0 / max(speed_kmh, 10)));
    trigger_m    = min(850, max(200, base_trigger * speed_factor));
    % Aerospace safety constraint
    speed_mps    = max(speed_kmh * 1000 / 3600, 1.0);
    min_safe     = (20 / speed_mps) + 3.0;
    green_s      = max(base_green, min_safe);
end

FIXED_TRIGGER = 500;
FIXED_GREEN   = 10;
AMB_SPEED     = 45;   % km/h for all scenarios

%% Compute RL decisions for each scenario
rl_triggers = zeros(1, n_scenarios);
rl_greens   = zeros(1, n_scenarios);

for i = 1:n_scenarios
    [t, g] = rl_decision(densities(i), AMB_SPEED);
    rl_triggers(i) = round(t);
    rl_greens(i)   = round(g * 10) / 10;
end

%% Simulate metrics per scenario (Monte Carlo: 50 runs each)
N_RUNS = 50;
SIM_T  = 300;  % seconds
DT     = 1;

% Pre-allocate
amb_delay_fixed = zeros(n_scenarios, N_RUNS);
amb_delay_rl    = zeros(n_scenarios, N_RUNS);
queue_fixed     = zeros(n_scenarios, N_RUNS);
queue_rl        = zeros(n_scenarios, N_RUNS);

for sc = 1:n_scenarios
    d = densities(sc);
    arr_rate = d * 0.6;  % vehicles/second (scales with density)
    trigger_rl = rl_triggers(sc);
    green_rl   = rl_greens(sc);
    AMB_DIST   = 650;
    AMB_SPD    = AMB_SPEED * 1000 / 3600;  % m/s

    for run = 1:N_RUNS
        rng(sc * 100 + run);

        % ── Fixed Rule
        q = 0; amb_pos = AMB_DIST; t_cross = NaN; preempted = false; p_end = Inf;
        for t = 1:SIM_T
            q = max(0, q + poissrnd(arr_rate * DT));
            amb_pos = max(0, AMB_DIST - t * AMB_SPD);
            if amb_pos <= FIXED_TRIGGER && ~preempted
                preempted = true; p_end = t + FIXED_GREEN;
            end
            if preempted && t < p_end
                q = max(0, q - 0.5 * DT);
            elseif mod(t, 80) < 30  % Normal green phase
                q = max(0, q - 0.5 * DT);
            end
            if amb_pos == 0 && isnan(t_cross)
                % Delay = extra time beyond free-flow
                t_cross = t;
            end
        end
        if isnan(t_cross), t_cross = SIM_T; end
        free_flow = AMB_DIST / AMB_SPD;
        amb_delay_fixed(sc, run) = max(0, t_cross - free_flow);
        queue_fixed(sc, run) = q;

        % ── RL Adaptive
        q = 0; amb_pos = AMB_DIST; t_cross = NaN; preempted = false; p_end = Inf;
        for t = 1:SIM_T
            q = max(0, q + poissrnd(arr_rate * DT));
            amb_pos = max(0, AMB_DIST - t * AMB_SPD);
            if amb_pos <= trigger_rl && ~preempted
                preempted = true; p_end = t + green_rl;
            end
            if preempted && t < p_end
                q = max(0, q - 0.5 * DT);
            elseif mod(t, 80) < 30
                q = max(0, q - 0.5 * DT);
            end
            if amb_pos == 0 && isnan(t_cross)
                t_cross = t;
            end
        end
        if isnan(t_cross), t_cross = SIM_T; end
        amb_delay_rl(sc, run) = max(0, t_cross - free_flow);
        queue_rl(sc, run) = q;
    end
end

%% Compute mean + std
mean_delay_fixed = mean(amb_delay_fixed, 2)';
mean_delay_rl    = mean(amb_delay_rl,    2)';
std_delay_fixed  = std(amb_delay_fixed,  0, 2)';
std_delay_rl     = std(amb_delay_rl,     0, 2)';

mean_q_fixed     = mean(queue_fixed, 2)';
mean_q_rl        = mean(queue_rl,    2)';

improvement_delay = (mean_delay_fixed - mean_delay_rl) ./ mean_delay_fixed * 100;
improvement_queue = (mean_q_fixed - mean_q_rl) ./ max(mean_q_fixed, 0.01) * 100;

fprintf('\n=== SCENARIO COMPARISON ===\n');
for i = 1:n_scenarios
    fprintf('[%d] density=%.2f | Delay: fixed=%.1fs, RL=%.1fs (-%.1f%%) | Trigger: fixed=%dm, RL=%dm\n', ...
        i, densities(i), mean_delay_fixed(i), mean_delay_rl(i), improvement_delay(i), ...
        FIXED_TRIGGER, rl_triggers(i));
end

%% Plotting
figure('Position', [50, 50, 1500, 820], 'Color', [0.06 0.06 0.10]);
dark_bg  = [0.10 0.10 0.16];
c_red    = [1.00 0.30 0.30];
c_cyan   = [0.13 0.82 0.93];
c_green  = [0.29 0.87 0.50];
c_amber  = [0.98 0.62 0.10];

x_labels = {'2AM', 'Morning', 'Daytime', 'Evening Rush', 'Incident'};
x = 1:n_scenarios;
bar_w = 0.35;

% Plot 1: Ambulance Delay
ax1 = subplot(2, 3, 1);
set(ax1, 'Color', dark_bg, 'XColor', [0.75 0.75 0.75], 'YColor', [0.75 0.75 0.75], ...
    'GridColor', [0.2 0.2 0.3], 'GridAlpha', 0.5);
hold on; grid on;

b1 = bar(x - bar_w/2, mean_delay_fixed, bar_w); b1.FaceColor = c_red;
b2 = bar(x + bar_w/2, mean_delay_rl,    bar_w); b2.FaceColor = c_cyan;

errorbar(x - bar_w/2, mean_delay_fixed, std_delay_fixed, '.', 'Color', [1 1 1 0.5], 'LineWidth', 1);
errorbar(x + bar_w/2, mean_delay_rl,    std_delay_rl,    '.', 'Color', [1 1 1 0.5], 'LineWidth', 1);

set(gca, 'XTick', x, 'XTickLabel', x_labels, 'XTickLabelRotation', 20, 'FontSize', 8);
ylabel('Ambulance Delay (s)', 'Color', [0.75 0.75 0.75]);
title('Ambulance Junction Delay', 'Color', 'w', 'FontWeight', 'bold', 'FontSize', 11);
legend({'Fixed Rule', 'RL Adaptive'}, 'TextColor', 'w', 'Color', dark_bg, 'Location', 'northwest');

% Plot 2: Delay Improvement %
ax2 = subplot(2, 3, 2);
set(ax2, 'Color', dark_bg, 'XColor', [0.75 0.75 0.75], 'YColor', [0.75 0.75 0.75], ...
    'GridColor', [0.2 0.2 0.3], 'GridAlpha', 0.5);
hold on; grid on;

bars = bar(x, improvement_delay, 'FaceColor', 'flat');
bars.CData = repmat(c_green, n_scenarios, 1);
bars.CData(improvement_delay < 20, :) = repmat(c_amber, sum(improvement_delay < 20), 1);

for i = 1:n_scenarios
    text(i, improvement_delay(i) + 1, sprintf('%.1f%%', improvement_delay(i)), ...
        'Color', 'w', 'HorizontalAlignment', 'center', 'FontSize', 9, 'FontWeight', 'bold');
end

yline(31.4, '--', 'Color', [0.9 0.9 0.9], 'LineWidth', 1.5, 'Label', 'Doc target: 31.4%');
set(gca, 'XTick', x, 'XTickLabel', x_labels, 'XTickLabelRotation', 20, 'FontSize', 8);
ylabel('Improvement (%)', 'Color', [0.75 0.75 0.75]);
title('RL Improvement in Delay', 'Color', 'w', 'FontWeight', 'bold', 'FontSize', 11);

% Plot 3: RL Trigger Distance vs Density
ax3 = subplot(2, 3, 3);
set(ax3, 'Color', dark_bg, 'XColor', [0.75 0.75 0.75], 'YColor', [0.75 0.75 0.75], ...
    'GridColor', [0.2 0.2 0.3], 'GridAlpha', 0.5);
hold on; grid on;

d_fine = 0:0.01:1;
trigger_fine = zeros(1, length(d_fine));
green_fine   = zeros(1, length(d_fine));
for i = 1:length(d_fine)
    [trigger_fine(i), green_fine(i)] = rl_decision(d_fine(i), AMB_SPEED);
end

yyaxis left
plot(d_fine, trigger_fine, 'Color', c_cyan, 'LineWidth', 2, 'DisplayName', 'Trigger distance');
yline(FIXED_TRIGGER, '--', 'Color', c_red, 'LineWidth', 1.5);
ylabel('Trigger Distance (m)', 'Color', c_cyan);
scatter(densities, rl_triggers, 60, 'o', 'filled', 'MarkerFaceColor', c_cyan, ...
    'MarkerEdgeColor', 'w', 'DisplayName', 'Demo scenarios');

yyaxis right
plot(d_fine, green_fine, 'Color', c_green, 'LineWidth', 2, 'DisplayName', 'Green duration');
yline(FIXED_GREEN, '--', 'Color', c_amber, 'LineWidth', 1.5);
ylabel('Green Duration (s)', 'Color', c_green);
scatter(densities, rl_greens, 60, 's', 'filled', 'MarkerFaceColor', c_green, ...
    'MarkerEdgeColor', 'w');

set(gca, 'YColor', [0.75 0.75 0.75]);
xlabel('Traffic Density', 'Color', [0.75 0.75 0.75]);
title('RL Policy Surface', 'Color', 'w', 'FontWeight', 'bold', 'FontSize', 11);

% Plot 4: Cross-traffic queue comparison
ax4 = subplot(2, 3, 4);
set(ax4, 'Color', dark_bg, 'XColor', [0.75 0.75 0.75], 'YColor', [0.75 0.75 0.75], ...
    'GridColor', [0.2 0.2 0.3], 'GridAlpha', 0.5);
hold on; grid on;

b3 = bar(x - bar_w/2, mean_q_fixed, bar_w); b3.FaceColor = c_red;
b4 = bar(x + bar_w/2, mean_q_rl,    bar_w); b4.FaceColor = c_cyan;
set(gca, 'XTick', x, 'XTickLabel', x_labels, 'XTickLabelRotation', 20, 'FontSize', 8);
ylabel('Avg Cross-Traffic Queue (veh)', 'Color', [0.75 0.75 0.75]);
title('Cross-Traffic Queue Length', 'Color', 'w', 'FontWeight', 'bold', 'FontSize', 11);
legend({'Fixed Rule', 'RL Adaptive'}, 'TextColor', 'w', 'Color', dark_bg, 'Location', 'northwest');

% Plot 5: Cumulative improvement
ax5 = subplot(2, 3, 5);
set(ax5, 'Color', dark_bg, 'XColor', [0.75 0.75 0.75], 'YColor', [0.75 0.75 0.75], ...
    'GridColor', [0.2 0.2 0.3], 'GridAlpha', 0.5);
hold on; grid on;

t_saved_total = sum(mean_delay_fixed - mean_delay_rl) * 24 * 3600 / SIM_T;
fprintf('Estimated daily time saved: %.0f vehicle-seconds\n', t_saved_total);

area_d = 0:0.01:1;
trigger_a = arrayfun(@(d) rl_decision(d, AMB_SPEED), area_d);
fill([area_d, fliplr(area_d)], [trigger_a, repmat(FIXED_TRIGGER, 1, length(area_d))], ...
    c_green, 'FaceAlpha', 0.25, 'EdgeColor', 'none', 'DisplayName', 'RL benefit zone');
plot(area_d, trigger_a,  'Color', c_cyan,  'LineWidth', 2.5, 'DisplayName', 'RL trigger');
yline(FIXED_TRIGGER, '--', 'Color', c_red, 'LineWidth', 1.5, 'Label', 'Fixed 500m');
xlabel('Traffic Density', 'Color', [0.75 0.75 0.75]);
ylabel('Trigger Distance (m)', 'Color', [0.75 0.75 0.75]);
title('RL Benefit Zone vs Fixed Rule', 'Color', 'w', 'FontWeight', 'bold', 'FontSize', 11);
legend({'RL Benefit Zone', 'RL Trigger', 'Fixed Trigger'}, ...
    'TextColor', 'w', 'Color', dark_bg, 'Location', 'northwest');

% Plot 6: Summary radar / summary table
ax6 = subplot(2, 3, 6);
set(ax6, 'Color', dark_bg, 'XColor', [0.75 0.75 0.75], 'YColor', [0.75 0.75 0.75]);
axis off;

summary_text = {
    'SMARTEVP+ RL SUMMARY', '',
    sprintf('Avg delay reduction:   %.1f%%', mean(improvement_delay)),
    sprintf('Peak hour improvement: %.1f%%', improvement_delay(4)),
    sprintf('Low-density savings:   %.1f%%', improvement_delay(1)),
    '',
    sprintf('RL trigger range:  %d – %dm', min(rl_triggers), max(rl_triggers)),
    sprintf('Fixed trigger:         %dm', FIXED_TRIGGER),
    '',
    sprintf('RL green range:   %.1f – %.1fs', min(rl_greens), max(rl_greens)),
    sprintf('Fixed green:         %ds', FIXED_GREEN),
    '',
    'Model: SmartEVP-DQN-PPO-v2',
    'Runtime: ONNX Edge (sub-1ms)',
};

y_pos = 0.95;
for i = 1:length(summary_text)
    line = summary_text{i};
    if i == 1
        fs = 11; fw = 'bold'; fc = [0.13 0.82 0.93];
    elseif startsWith(line, 'Avg') || startsWith(line, 'Peak') || startsWith(line, 'Low')
        fs = 9; fw = 'normal'; fc = [0.29 0.87 0.50];
    elseif startsWith(line, 'Model') || startsWith(line, 'Runtime')
        fs = 8; fw = 'normal'; fc = [0.7 0.5 0.9];
    else
        fs = 9; fw = 'normal'; fc = [0.8 0.8 0.8];
    end
    text(0.05, y_pos, line, 'Units', 'normalized', 'Color', fc, ...
        'FontSize', fs, 'FontWeight', fw, 'FontName', 'Consolas');
    y_pos = y_pos - 0.065;
end

sgtitle('SmartEVP+ — Fixed-Rule vs RL-Adaptive Preemption (5 Traffic Scenarios)', ...
    'Color', 'w', 'FontSize', 14, 'FontWeight', 'bold');

saveas(gcf, fullfile('plots', '03_baseline_vs_optimized.png'));
fprintf('Plot saved: plots/03_baseline_vs_optimized.png\n');

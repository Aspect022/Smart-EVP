# SmartEVP+ — Mobile App Guide (Driver App)
### Team V3 · TechnoCognition'25 · Dayananda Sagar University
### v2.0 — Expo Go, No Build Required

> **The driver app replaces SMS as the primary notification channel.** When a case is dispatched, the driver's Expo app receives a full-screen alert with all patient details, shows the signal corridor status in real time, and displays the Gemma-generated patient brief en route. For the demo, your friend runs this app on their phone via Expo Go — scan a QR code, it opens like a native app.

---

## Table of Contents

- [SmartEVP+ — Mobile App Guide (Driver App)](#smartevp--mobile-app-guide-driver-app)
    - [Team V3 · TechnoCognition'25 · Dayananda Sagar University](#team-v3--technocognition25--dayananda-sagar-university)
    - [v2.0 — Expo Go, No Build Required](#v20--expo-go-no-build-required)
  - [Table of Contents](#table-of-contents)
  - [1. App Purpose and Demo Role](#1-app-purpose-and-demo-role)
  - [2. Design Philosophy — Mobile](#2-design-philosophy--mobile)
  - [3. Color System and Typography](#3-color-system-and-typography)
    - [theme.js](#themejs)
    - [Loading Fonts](#loading-fonts)
    - [Type Scale (Mobile)](#type-scale-mobile)
  - [4. Screen Inventory](#4-screen-inventory)
  - [5. Screen 1: Splash](#5-screen-1-splash)
  - [6. Screen 2: Driver Login](#6-screen-2-driver-login)
  - [7. Screen 3: Home — Idle / Available](#7-screen-3-home--idle--available)
  - [8. Screen 4: Dispatch Alert — Full-Screen Takeover](#8-screen-4-dispatch-alert--full-screen-takeover)
  - [9. Screen 5: Active Case — En Route](#9-screen-5-active-case--en-route)
  - [10. Screen 6: Patient Brief Tab](#10-screen-6-patient-brief-tab)
  - [11. Screen 7: Driver Profile](#11-screen-7-driver-profile)
  - [12. Architecture — How the App Connects](#12-architecture--how-the-app-connects)
  - [13. Project Setup with Expo](#13-project-setup-with-expo)
    - [Scan QR Code on Friend's Phone](#scan-qr-code-on-friends-phone)
  - [14. File Structure](#14-file-structure)
  - [15. Navigation Setup](#15-navigation-setup)
  - [16. Data Layer — Polling + Socket.IO](#16-data-layer--polling--socketio)
  - [17. API Integration](#17-api-integration)
  - [18. Language Support](#18-language-support)
  - [19. Expo Go — Demo Setup](#19-expo-go--demo-setup)
    - [Before the Demo](#before-the-demo)
    - [Finding Laptop 1's IP](#finding-laptop-1s-ip)
    - [If QR Code Doesn't Scan](#if-qr-code-doesnt-scan)
  - [20. Build Priority Order](#20-build-priority-order)

---

## 1. App Purpose and Demo Role

**What it does in the demo:**

| Moment | What happens on the phone |
|--------|--------------------------|
| Emergency call processed | App detects new case within ~2 seconds (polling) |
| Alert fires | Full-screen takeover — vibration + red flash |
| Friend taps ACCEPT | Master dashboard on Laptop 1 shows "DRIVER ACCEPTED" |
| Ambulance en route | Active case view shows signal status and case info |
| LEDs flip green | App's corridor bar simultaneously flips to green |
| Brief generates | Patient brief tab populates from Gemma output |

**Why it's better than SMS for the demo:**
- Judges can physically hold and interact with it
- Full-screen alert is visually dramatic and impossible to miss
- Shows the system has a product-grade UX layer, not just hardware
- Language toggle (English / Hindi / Kannada) is a strong India-specific talking point
- Driver acceptance creates a real-time feedback loop visible on all dashboards

**SMS is still sent.** The app doesn't replace SMS — it complements it. This means: "Even feature phones get notified. Nobody is left behind."

---

## 2. Design Philosophy — Mobile

Same brand identity as the web dashboards. Same colors, same fonts, adapted for one-handed mobile use.

**Three mobile-specific principles:**

**1. Glanceable at speed.** The driver is in a moving vehicle. Critical info — signal state, destination, severity — must be readable in under 1 second. Large text, massive color signals, status first.

**2. One thumb, one action.** Every critical action — Accept Dispatch, View Brief — is a single large button at thumb reach. Minimum button height 56px. No small touch targets.

**3. The alert demands attention.** When a new case arrives, the screen must take over completely. Full-screen red flash, vibration, the biggest text on the screen. Missing a dispatch alert is not acceptable.

---

## 3. Color System and Typography

Identical to web. Defined once in `theme.js`, used everywhere.

### theme.js

```javascript
// src/theme.js
export const colors = {
  bg:      '#080b12',
  bg2:     '#0d1117',
  bg3:     '#111620',
  card:    '#131924',
  border:  '#1e2838',
  border2: '#243044',

  red:     '#ff3b3b',
  amber:   '#f59e0b',
  cyan:    '#22d3ee',
  green:   '#4ade80',
  purple:  '#a78bfa',

  textPrimary: '#e2e8f0',
  textDim:     '#94a3b8',
  textMuted:   '#64748b',
}

export const fonts = {
  syne:      'Syne',
  syneXBold: 'SyneExtraBold',
  mono:      'JetBrainsMono',
  monoBold:  'JetBrainsMonoBold',
}
```

### Loading Fonts

Download TTF files:
- **Syne:** https://fonts.google.com/specimen/Syne → Download family → grab `Syne-Bold.ttf` and `Syne-ExtraBold.ttf`
- **JetBrains Mono:** https://www.jetbrains.com/lp/mono/ → Download → grab `JetBrainsMono-Regular.ttf` and `JetBrainsMono-SemiBold.ttf`

Place in `assets/fonts/`.

```javascript
// src/hooks/useAppFonts.js
import { useFonts } from 'expo-font'

export function useAppFonts() {
  const [loaded, error] = useFonts({
    'Syne':              require('../../assets/fonts/Syne-Bold.ttf'),
    'SyneExtraBold':     require('../../assets/fonts/Syne-ExtraBold.ttf'),
    'JetBrainsMono':     require('../../assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMonoBold': require('../../assets/fonts/JetBrainsMono-SemiBold.ttf'),
  })
  return { loaded, error }
}
```

### Type Scale (Mobile)

| Use | Font | Size | Weight |
|-----|------|------|--------|
| Alert headline | SyneExtraBold | 28px | 800 |
| Big numbers (ETA) | SyneExtraBold | 40px | 800 |
| Section header | Syne | 18px | 700 |
| Card title | Syne | 15px | 700 |
| Body / labels | JetBrainsMono | 13px | 400 |
| Captions / meta | JetBrainsMono | 11px | 400 |
| Status badges | JetBrainsMonoBold | 10px | 600, UPPERCASE, letterSpacing 2 |

---

## 4. Screen Inventory

| Screen | When | Stack Route |
|--------|------|-------------|
| Splash | App launch, 2 seconds | `Splash` |
| Login | Select driver on first open | `Login` |
| Home | No active case — driver available | `Home` |
| Alert | New case assigned — full-screen takeover | `Alert` |
| ActiveCase | After Accept tapped | `ActiveCase` |
| Profile | From Home top-right button | `Profile` |

---

## 5. Screen 1: Splash

2-second boot screen. Animates a progress bar, then navigates to Login.

```jsx
// src/screens/SplashScreen.jsx
import { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { colors, fonts } from '../theme'

export default function SplashScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1, duration: 2000, useNativeDriver: false
    }).start(() => navigation.replace('Login'))
  }, [])

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <View style={s.container}>
      <View style={s.center}>
        <Text style={s.logo}>
          Smart<Text style={{ color: colors.red }}>EVP+</Text>
        </Text>
        <Text style={s.sub}>ERIS v2.0 · Driver</Text>
      </View>
      <View style={s.track}>
        <Animated.View style={[s.bar, { width: barWidth }]} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo:      { fontFamily: fonts.syneXBold, fontSize: 44, color: colors.textPrimary, letterSpacing: -1 },
  sub:       { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, letterSpacing: 3 },
  track:     { height: 2, backgroundColor: colors.border },
  bar:       { height: 2, backgroundColor: colors.red },
})
```

---

## 6. Screen 2: Driver Login

Select a driver profile. No real auth — just pick from a hardcoded list.

```jsx
// src/screens/LoginScreen.jsx
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useDriver } from '../context/DriverContext'
import { colors, fonts } from '../theme'

const DRIVERS = [
  { id: 'D001', name: 'Ravi Kumar',   license: 'KA-01-AB-1234', vehicle: 'AMB-001' },
  { id: 'D002', name: 'Priya Nair',   license: 'KA-02-CD-5678', vehicle: 'AMB-002' },
]

export default function LoginScreen({ navigation }) {
  const { setDriver } = useDriver()

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.eyebrow}>01 — DRIVER PROFILE</Text>
        <Text style={s.title}>Select Your{'\n'}Profile</Text>
        <Text style={s.sub}>SmartEVP+ dispatch alerts will come to your device</Text>

        {DRIVERS.map(d => (
          <TouchableOpacity key={d.id} style={s.card} activeOpacity={0.7}
            onPress={() => { setDriver(d); navigation.replace('Home') }}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{d.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{d.name}</Text>
              <Text style={s.meta}>{d.license} · {d.vehicle}</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, paddingTop: 48 },
  eyebrow:   { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted,
               letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  title:     { fontFamily: fonts.syneXBold, fontSize: 36, color: colors.textPrimary,
               lineHeight: 40, marginBottom: 8 },
  sub:       { fontFamily: fonts.mono, fontSize: 12, color: colors.textDim, marginBottom: 40 },
  card:      { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
               borderTopWidth: 2, borderTopColor: colors.cyan, borderRadius: 8,
               padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.cyan + '20',
               borderWidth: 1, borderColor: colors.cyan + '40', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: fonts.syne, fontSize: 20, color: colors.cyan },
  name:      { fontFamily: fonts.syne, fontSize: 16, color: colors.textPrimary },
  meta:      { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  arrow:     { fontFamily: fonts.mono, fontSize: 20, color: colors.textMuted },
})
```

---

## 7. Screen 3: Home — Idle / Available

**When:** Driver is logged in. No active case.

**Key elements:**
- Large `AVAILABLE` status badge in green with pulsing dot
- Shift stats row: cases today, hours on shift, distance
- Language toggle: EN | हिं | ಕನ್ನಡ
- Connection indicator (connected to SmartEVP+ or reconnecting)
- Profile button (top right)

```jsx
// src/screens/HomeScreen.jsx
import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native'
import { useDriver }   from '../context/DriverContext'
import { useDispatch } from '../hooks/useDispatch'
import { useLanguage } from '../context/LanguageContext'
import { colors, fonts } from '../theme'

export default function HomeScreen({ navigation }) {
  const { driver }                    = useDriver()
  const { activeCase, connected }     = useDispatch()
  const { t, language, setLanguage }  = useLanguage()
  const pulse = useRef(new Animated.Value(1)).current

  // Navigate to Alert when case arrives
  useEffect(() => {
    if (activeCase) navigation.navigate('Alert')
  }, [activeCase])

  // Pulsing green dot
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.5, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
    ]))
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{t('hello')}, {driver?.name?.split(' ')[0]}</Text>
            <Text style={s.vehicle}>{driver?.vehicle} · {driver?.license}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.profileBtn}>
            <Text style={s.profileInitial}>{driver?.name?.[0]}</Text>
          </TouchableOpacity>
        </View>

        {/* Status card */}
        <View style={[s.card, { borderTopColor: colors.green }]}>
          <View style={s.statusRow}>
            <Animated.View style={[s.dot, { transform: [{ scale: pulse }] }]} />
            <Text style={[s.statusText, { color: colors.green }]}>{t('available')}</Text>
          </View>
          <Text style={s.statusSub}>{t('waitingDispatch')}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard label={t('casesToday')} value="3" color={colors.cyan} />
          <StatCard label={t('hoursShift')} value="4.5h" color={colors.amber} />
          <StatCard label={t('distance')} value="38km" color={colors.purple} />
        </View>

        {/* Connection */}
        <View style={s.connRow}>
          <View style={[s.connDot, { backgroundColor: connected ? colors.green : colors.red }]} />
          <Text style={s.connText}>
            {connected ? t('connected') : t('reconnecting')}
          </Text>
        </View>

        {/* Language toggle */}
        <View style={s.langRow}>
          {[['EN','en'],['हिं','hi'],['ಕನ್ನಡ','kn']].map(([label, code]) => (
            <TouchableOpacity key={code} onPress={() => setLanguage(code)}
              style={[s.langBtn, language === code && s.langBtnActive]}>
              <Text style={[s.langText, language === code && { color: colors.cyan }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const StatCard = ({ label, value, color }) => (
  <View style={[s.stat, { borderTopColor: color }]}>
    <Text style={[s.statVal, { color }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
)

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  container:  { flex: 1, padding: 20, paddingTop: 16 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting:   { fontFamily: fonts.syne, fontSize: 22, color: colors.textPrimary },
  vehicle:    { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cyan + '20',
                borderWidth: 1, borderColor: colors.cyan + '40', alignItems: 'center', justifyContent: 'center' },
  profileInitial: { fontFamily: fonts.syne, fontSize: 18, color: colors.cyan },
  card:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                borderTopWidth: 2, borderRadius: 8, padding: 20, marginBottom: 16 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  dot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  statusText: { fontFamily: fonts.syne, fontSize: 20 },
  statusSub:  { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  statsRow:   { flexDirection: 'row', gap: 8, marginBottom: 24 },
  stat:       { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                borderTopWidth: 2, borderRadius: 6, padding: 12, alignItems: 'center' },
  statVal:    { fontFamily: fonts.syneXBold, fontSize: 22 },
  statLabel:  { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted,
                textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, textAlign: 'center' },
  connRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto' },
  connDot:    { width: 6, height: 6, borderRadius: 3 },
  connText:   { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
  langRow:    { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 16,
                borderTopWidth: 1, borderTopColor: colors.border },
  langBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1,
                borderColor: colors.border, borderRadius: 4 },
  langBtnActive: { borderColor: colors.cyan, backgroundColor: colors.cyan + '15' },
  langText:   { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
})
```

---

## 8. Screen 4: Dispatch Alert — Full-Screen Takeover

**The most important screen.** Appears when a new case is detected. Must be impossible to miss.

**Design:** Full-screen. Red flash on mount. Vibration. Huge text. One big green ACCEPT button.

```jsx
// src/screens/AlertScreen.jsx
import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Vibration } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useDispatch }   from '../hooks/useDispatch'
import { useLanguage }   from '../context/LanguageContext'
import { acceptCase }    from '../api'
import { colors, fonts } from '../theme'

export default function AlertScreen({ navigation }) {
  const { activeCase } = useDispatch()
  const { t } = useLanguage()
  const bg   = useRef(new Animated.Value(0)).current
  const card = useRef(new Animated.Value(60)).current

  useEffect(() => {
    // Vibration pattern
    Vibration.vibrate([0, 400, 200, 400])
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) } catch {}

    // Red flash then fade
    Animated.sequence([
      Animated.timing(bg, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(bg, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start()

    // Card slides up
    Animated.spring(card, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start()
  }, [])

  const bgColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bg, 'rgba(255,59,59,0.14)']
  })

  const isCrit = activeCase?.severity === 'CRITICAL'
  const accent = isCrit ? colors.red : colors.amber

  const handleAccept = async () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) } catch {}
    await acceptCase(activeCase?.case_id)
    navigation.replace('ActiveCase')
  }

  return (
    <Animated.View style={[s.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.inner}>
          {/* Alert header */}
          <View style={s.alertHeader}>
            <Text style={s.alertIcon}>🚨</Text>
            <Text style={s.alertTitle}>{t('dispatchAlert')}</Text>
          </View>

          {/* Case card */}
          <Animated.View style={[s.card, { transform: [{ translateY: card }] }]}>
            <View style={[s.severityBar, { backgroundColor: accent }]} />

            <View style={s.cardHead}>
              <Text style={s.caseId}>CASE #{activeCase?.case_id}</Text>
              <View style={[s.badge, { borderColor: accent + '50', backgroundColor: accent + '15' }]}>
                <Text style={[s.badgeText, { color: accent }]}>
                  {isCrit ? 'P1 — CRITICAL' : 'P2 — HIGH'}
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            <InfoRow icon="📍" label={t('location')} value={activeCase?.location} />
            <InfoRow icon="🩺" label={t('symptoms')} value={activeCase?.symptoms?.substring(0, 90)} />

            <View style={s.divider} />

            <Text style={s.smsNote}>📱 {t('smsAlsoSent')}</Text>
          </Animated.View>

          {/* Buttons */}
          <View style={s.buttons}>
            <TouchableOpacity style={s.acceptBtn} onPress={handleAccept} activeOpacity={0.8}>
              <Text style={s.acceptText}>✓ {t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.declineBtn}
              onPress={() => navigation.replace('Home')} activeOpacity={0.8}>
              <Text style={s.declineText}>{t('decline')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  )
}

const InfoRow = ({ icon, label, value }) => (
  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
    <Text style={{ fontSize: 18, width: 24 }}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 10, color: colors.textMuted,
                     textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: 'Syne', fontSize: 14, color: colors.textPrimary }}>
        {value}
      </Text>
    </View>
  </View>
)

const s = StyleSheet.create({
  container:   { flex: 1 },
  inner:       { flex: 1, padding: 20, paddingTop: 40 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  alertIcon:   { fontSize: 28 },
  alertTitle:  { fontFamily: fonts.syneXBold, fontSize: 28, color: colors.red },
  card:        { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                 borderRadius: 10, padding: 20, marginBottom: 24, overflow: 'hidden' },
  severityBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  cardHead:    { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center', marginTop: 6, marginBottom: 16 },
  caseId:      { fontFamily: fonts.syneXBold, fontSize: 20, color: colors.textPrimary },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  badgeText:   { fontFamily: fonts.monoBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  divider:     { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  smsNote:     { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  buttons:     { gap: 10, marginTop: 'auto' },
  acceptBtn:   { backgroundColor: colors.green, borderRadius: 8, padding: 18, alignItems: 'center',
                 shadowColor: colors.green, shadowOffset: { width: 0, height: 4 },
                 shadowOpacity: 0.4, shadowRadius: 12 },
  acceptText:  { fontFamily: fonts.syneXBold, fontSize: 18, color: colors.bg },
  declineBtn:  { borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                 padding: 14, alignItems: 'center' },
  declineText: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted },
})
```

---

## 9. Screen 5: Active Case — En Route

**After Accept is tapped.** Shows the case details and the signal corridor status.

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header: 🚑 AMB-001 EN ROUTE · Case #C0042 │
├─────────────────────────────────────────┤
│ Case info card                          │
│ Location · Priority · Time dispatched   │
├─────────────────────────────────────────┤
│ SIGNAL CORRIDOR STATUS (prominent)      │
│                                         │
│ 🔴 INT-01 · Approaching                 │
│ OR                                      │
│ 🟢 GREEN CORRIDOR — PROCEED             │
│    (green bg, haptic feedback)          │
├─────────────────────────────────────────┤
│ [ CASE INFO ] [ PATIENT BRIEF ]  ← tabs │
│                                         │
│ Brief tab: compact Gemma output         │
│ Appears when brief arrives              │
└─────────────────────────────────────────┘
```

```jsx
// src/screens/ActiveCaseScreen.jsx
import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useDispatch }   from '../hooks/useDispatch'
import { useLanguage }   from '../context/LanguageContext'
import { colors, fonts } from '../theme'

export default function ActiveCaseScreen({ navigation }) {
  const { activeCase, signalState, latency, medicalBrief, transcript } = useDispatch()
  const { t } = useLanguage()
  const [tab, setTab] = useState(0)
  const prevSignal = useRef('RED')
  const corridorAnim = useRef(new Animated.Value(0)).current

  // Haptic + animation when signal flips green
  useEffect(() => {
    if (signalState === 'GREEN' && prevSignal.current !== 'GREEN') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) } catch {}
      Animated.sequence([
        Animated.timing(corridorAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(corridorAnim, { toValue: 0.7, duration: 400, useNativeDriver: false }),
      ]).start()
    }
    prevSignal.current = signalState
  }, [signalState])

  const isGreen = signalState === 'GREEN'
  const corridorBg = corridorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(74,222,128,0.06)', 'rgba(74,222,128,0.18)']
  })

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>🚑 AMB-001 EN ROUTE</Text>
          <Text style={s.headerSub}>CASE #{activeCase?.case_id}</Text>
        </View>

        {/* Signal corridor */}
        <Animated.View style={[
          s.corridor,
          isGreen
            ? { borderTopColor: colors.green, borderColor: colors.green + '40', backgroundColor: corridorBg }
            : { borderTopColor: colors.red, borderColor: colors.border }
        ]}>
          <View style={[s.corridorDot, {
            backgroundColor: isGreen ? colors.green : colors.red,
            shadowColor: isGreen ? colors.green : colors.red,
            shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }
          }]} />
          <View>
            <Text style={[s.corridorTitle, { color: isGreen ? colors.green : colors.red }]}>
              {isGreen ? 'GREEN CORRIDOR — PROCEED' : 'INTERSECTION AHEAD'}
            </Text>
            <Text style={s.corridorSub}>
              {isGreen
                ? `INT-01 · Authenticated · ${latency ? (latency/1000).toFixed(2) + 's' : '—'}`
                : 'INT-01 · Approaching · Preemption armed'}
            </Text>
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={s.tabBar}>
          {['CASE INFO', 'PATIENT BRIEF'].map((label, i) => (
            <TouchableOpacity key={label} onPress={() => setTab(i)}
              style={[s.tabBtn, tab === i && s.tabBtnActive]}>
              <Text style={[s.tabText, tab === i && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={s.tabContent}>
          {tab === 0 ? (
            <CaseInfoTab caseData={activeCase} />
          ) : (
            <PatientBriefTab brief={medicalBrief} transcript={transcript} />
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const CaseInfoTab = ({ caseData }) => (
  <View style={{ gap: 12 }}>
    <TRow icon="📍" label="Location" value={caseData?.location} />
    <TRow icon="🩺" label="Symptoms" value={caseData?.symptoms} />
    <TRow icon="⚠️" label="Priority" value={caseData?.severity} />
  </View>
)

const PatientBriefTab = ({ brief, transcript }) => {
  if (!brief) return (
    <View style={{ paddingTop: 24, gap: 8 }}>
      <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
        Generating patient brief...
      </Text>
      <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: colors.textMuted,
                     textAlign: 'center', lineHeight: 18 }}>
        {transcript?.substring(0, 120) || 'Awaiting nurse audio input...'}
      </Text>
    </View>
  )

  return (
    <View style={{ gap: 12 }}>
      <TRow label="Chief Complaint" value={brief.chief_complaint} />
      <TRow label="Suspected" value={brief.suspected_diagnosis} valueColor={colors.amber} />
      <TRow label="BP / HR / SpO2" value={`${brief.vitals?.bp} · ${brief.vitals?.hr} · ${brief.vitals?.spo2}`} />
      <TRow label="Allergies" value={brief.allergies?.join(', ') || 'None known'} />
      <View>
        <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 10, color: colors.textMuted,
                       textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Resources</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {brief.resources_required?.map(r => (
            <Text key={r} style={{ fontFamily: 'JetBrainsMono', fontSize: 10, color: colors.green,
                                   borderWidth: 1, borderColor: colors.green + '30',
                                   backgroundColor: colors.green + '10', paddingHorizontal: 8,
                                   paddingVertical: 4, borderRadius: 4 }}>
              ✓ {r}
            </Text>
          ))}
        </View>
      </View>
      <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 10, color: colors.purple,
                     borderWidth: 1, borderColor: colors.purple + '30',
                     backgroundColor: colors.purple + '10', padding: 8, borderRadius: 4 }}>
        ● AI GENERATED — Gemma 2B on-device
      </Text>
    </View>
  )
}

const TRow = ({ icon, label, value, valueColor = colors.textPrimary }) => (
  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
    {icon && <Text style={{ fontSize: 16, width: 20 }}>{icon}</Text>}
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 10, color: colors.textMuted,
                     textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 12, color: valueColor, lineHeight: 18 }}>
        {value}
      </Text>
    </View>
  </View>
)

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.bg },
  container:      { flex: 1, padding: 20, paddingTop: 12 },
  header:         { marginBottom: 16 },
  headerTitle:    { fontFamily: fonts.syne, fontSize: 16, color: colors.textPrimary },
  headerSub:      { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  corridor:       { borderWidth: 1, borderTopWidth: 2, borderRadius: 8, padding: 16,
                    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  corridorDot:    { width: 44, height: 44, borderRadius: 22 },
  corridorTitle:  { fontFamily: fonts.syneXBold, fontSize: 15 },
  corridorSub:    { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border,
                    marginBottom: 16 },
  tabBtn:         { flex: 1, paddingVertical: 10, alignItems: 'center',
                    borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive:   { borderBottomColor: colors.red },
  tabText:        { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted,
                    textTransform: 'uppercase', letterSpacing: 1 },
  tabTextActive:  { color: colors.textPrimary },
  tabContent:     { flex: 1 },
})
```

---

## 10. Screen 6: Patient Brief Tab

The Patient Brief tab is embedded within `ActiveCaseScreen` above (the `PatientBriefTab` component). It shows when the `brief` data arrives from polling/socket, with:

- Chief complaint + suspected diagnosis (amber text for Dx)
- Vitals row
- Allergies and medications
- Resources list (green badges)
- AI attribution badge (purple)

If the brief hasn't arrived yet, it shows the raw transcript text so the driver can see data is flowing.

---

## 11. Screen 7: Driver Profile

```jsx
// src/screens/ProfileScreen.jsx
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useDriver }   from '../context/DriverContext'
import { useLanguage } from '../context/LanguageContext'
import { colors, fonts } from '../theme'

export default function ProfileScreen({ navigation }) {
  const { driver } = useDriver()
  const { t, language, setLanguage } = useLanguage()

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← {t('back')}</Text>
        </TouchableOpacity>

        <Text style={s.eyebrow}>DRIVER PROFILE</Text>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{driver?.name?.[0]}</Text>
          </View>
          <Text style={s.name}>{driver?.name}</Text>
          <Text style={s.meta}>{driver?.vehicle} · {driver?.license}</Text>
        </View>

        {/* Today stats */}
        <Text style={s.section}>TODAY</Text>
        <View style={s.statsGrid}>
          <StatItem label="Cases" value="3" color={colors.cyan} />
          <StatItem label="Distance" value="38 km" color={colors.amber} />
          <StatItem label="Avg Response" value="3m 45s" color={colors.green} />
        </View>

        {/* Career */}
        <Text style={s.section}>CAREER TOTAL</Text>
        <View style={s.statsGrid}>
          <StatItem label="Total Cases" value="247" color={colors.cyan} />
          <StatItem label="Km Driven" value="4,890" color={colors.amber} />
          <StatItem label="Months Active" value="18" color={colors.purple} />
        </View>

        {/* Language */}
        <Text style={s.section}>LANGUAGE</Text>
        <View style={s.langRow}>
          {[['English','en'],['हिंदी','hi'],['ಕನ್ನಡ','kn']].map(([label, code]) => (
            <TouchableOpacity key={code} onPress={() => setLanguage(code)}
              style={[s.langBtn, language === code && s.langActive]}>
              <Text style={[s.langText, language === code && { color: colors.cyan }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Future scope note */}
        <View style={s.futureCard}>
          <Text style={s.futureTxt}>
            💳 Universal pay integration — future scope{'\n'}
            Based on verified dispatch hours logged in SmartEVP+
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const StatItem = ({ label, value, color }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={{ fontFamily: 'SyneExtraBold', fontSize: 22, color }}>{value}</Text>
    <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 10, color: colors.textMuted,
                   textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, textAlign: 'center' }}>
      {label}
    </Text>
  </View>
)

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20 },
  back:      { marginBottom: 20 },
  backText:  { fontFamily: 'JetBrainsMono', fontSize: 12, color: colors.textMuted },
  eyebrow:   { fontFamily: 'JetBrainsMono', fontSize: 10, color: colors.textMuted,
               letterSpacing: 3, marginBottom: 20 },
  avatarWrap:{ alignItems: 'center', marginBottom: 28 },
  avatar:    { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.cyan + '20',
               borderWidth: 2, borderColor: colors.cyan + '40', alignItems: 'center',
               justifyContent: 'center', marginBottom: 12 },
  avatarTxt: { fontFamily: 'SyneExtraBold', fontSize: 32, color: colors.cyan },
  name:      { fontFamily: 'Syne', fontSize: 22, color: colors.textPrimary },
  meta:      { fontFamily: 'JetBrainsMono', fontSize: 12, color: colors.textMuted, marginTop: 4 },
  section:   { fontFamily: 'JetBrainsMono', fontSize: 10, color: colors.textMuted,
               letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', backgroundColor: colors.card, borderWidth: 1,
               borderColor: colors.border, borderRadius: 8, padding: 16,
               marginBottom: 24, gap: 8 },
  langRow:   { flexDirection: 'row', gap: 8, marginBottom: 24 },
  langBtn:   { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: colors.border,
               borderRadius: 6, alignItems: 'center' },
  langActive:{ borderColor: colors.cyan, backgroundColor: colors.cyan + '12' },
  langText:  { fontFamily: 'JetBrainsMono', fontSize: 12, color: colors.textMuted },
  futureCard:{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
               borderRadius: 8, padding: 16, borderLeftWidth: 2, borderLeftColor: colors.purple },
  futureTxt: { fontFamily: 'JetBrainsMono', fontSize: 11, color: colors.textMuted, lineHeight: 18 },
})
```

---

## 12. Architecture — How the App Connects

Everything connects to **Laptop 1** at port **8080** (Flask backend).

```
Expo App (Friend's Phone)
    │
    ├── HTTP polling every 2 seconds
    │     GET http://[Laptop1IP]:8080/api/state
    │     → gets: active_case, signal_state, medical_brief
    │
    ├── HTTP POST on Accept
    │     POST http://[Laptop1IP]:8080/api/driver/accept
    │     → Flask publishes to MQTT: smartevp/driver/accepted
    │     → Master dashboard shows DRIVER ACCEPTED in audit log
    │
    └── All devices on same hotspot WiFi
```

**Why polling instead of Socket.IO?** Socket.IO in bare React Native requires extra native setup and can be flaky in hackathon environments. Polling every 2 seconds is reliable and sufficient — the alert fires within 2 seconds of dispatch, which is fine for the demo.

If you have extra time, you can add Socket.IO for real-time signal updates (faster green corridor detection):

```javascript
// Optional: add to useDispatch if time permits
import { io } from 'socket.io-client'
const socket = io(`http://${LAPTOP_IP}:8080`)
socket.on('signal_update', (d) => setSignalState(d.state))
socket.on('medical_brief', (d) => setMedicalBrief(d.brief))
```

---

## 13. Project Setup with Expo

```bash
# Install Expo CLI
npm install -g expo-cli

# Create project
npx create-expo-app smartevp-driver --template blank
cd smartevp-driver

# Install dependencies
npx expo install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler
npx expo install expo-font expo-haptics axios

# Start dev server
npx expo start
```

### Scan QR Code on Friend's Phone

1. Install **Expo Go** from Play Store on friend's phone
2. Run `npx expo start` on laptop
3. Scan QR code with Expo Go
4. App opens — no build, no APK needed

---

## 14. File Structure

```
smartevp-driver/
├── App.js
├── assets/
│   └── fonts/
│       ├── Syne-Bold.ttf
│       ├── Syne-ExtraBold.ttf
│       ├── JetBrainsMono-Regular.ttf
│       └── JetBrainsMono-SemiBold.ttf
└── src/
    ├── screens/
    │   ├── SplashScreen.jsx
    │   ├── LoginScreen.jsx
    │   ├── HomeScreen.jsx
    │   ├── AlertScreen.jsx
    │   ├── ActiveCaseScreen.jsx
    │   └── ProfileScreen.jsx
    ├── hooks/
    │   ├── useDispatch.js      ← polls /api/state every 2s
    │   └── useAppFonts.js
    ├── context/
    │   ├── DriverContext.js    ← selected driver profile
    │   └── LanguageContext.js  ← i18n
    ├── i18n/
    │   ├── en.js
    │   ├── hi.js
    │   └── kn.js
    ├── api.js                  ← all HTTP call functions
    └── theme.js                ← colors + fonts
```

---

## 15. Navigation Setup

```jsx
// App.js
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { DriverProvider }   from './src/context/DriverContext'
import { LanguageProvider } from './src/context/LanguageContext'
import { useAppFonts }      from './src/hooks/useAppFonts'
import SplashScr    from './src/screens/SplashScreen'
import LoginScr     from './src/screens/LoginScreen'
import HomeScr      from './src/screens/HomeScreen'
import AlertScr     from './src/screens/AlertScreen'
import ActiveScr    from './src/screens/ActiveCaseScreen'
import ProfileScr   from './src/screens/ProfileScreen'

SplashScreen.preventAutoHideAsync()
const Stack = createStackNavigator()

export default function App() {
  const { loaded } = useAppFonts()

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync()
  }, [loaded])

  if (!loaded) return null

  return (
    <DriverProvider>
      <LanguageProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#080b12' } }}
            initialRouteName="Splash"
          >
            <Stack.Screen name="Splash"      component={SplashScr} />
            <Stack.Screen name="Login"       component={LoginScr} />
            <Stack.Screen name="Home"        component={HomeScr} />
            <Stack.Screen name="Alert"       component={AlertScr} />
            <Stack.Screen name="ActiveCase"  component={ActiveScr} />
            <Stack.Screen name="Profile"     component={ProfileScr} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </DriverProvider>
  )
}
```

---

## 16. Data Layer — Polling + Socket.IO

```javascript
// src/hooks/useDispatch.js
import { useState, useEffect, useRef } from 'react'
import { getState } from '../api'

export function useDispatch() {
  const [activeCase,    setActiveCase]    = useState(null)
  const [signalState,   setSignalState]   = useState('RED')
  const [medicalBrief,  setMedicalBrief]  = useState(null)
  const [transcript,    setTranscript]    = useState(null)
  const [latency,       setLatency]       = useState(null)
  const [connected,     setConnected]     = useState(false)
  const prevCaseId = useRef(null)

  useEffect(() => {
    let running = true

    const poll = async () => {
      if (!running) return
      try {
        const state = await getState()
        setConnected(true)
        setSignalState(state.signal_state || 'RED')
        setMedicalBrief(state.medical_brief || null)
        if (state.preemption_latency_ms) setLatency(state.preemption_latency_ms)

        const c = state.active_case
        if (c && c.case_id !== prevCaseId.current) {
          prevCaseId.current = c.case_id
          setActiveCase(c)
          setMedicalBrief(null)   // Clear old brief on new case
          setTranscript(null)
        }
        if (!c) {
          prevCaseId.current = null
          setActiveCase(null)
        }
      } catch {
        setConnected(false)
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => { running = false; clearInterval(interval) }
  }, [])

  return { activeCase, signalState, medicalBrief, transcript, latency, connected }
}
```

---

## 17. API Integration

```javascript
// src/api.js
// Update LAPTOP_IP to Laptop 1's hotspot IP before demo
// Find it with: ipconfig (Windows) | ifconfig (Mac) | hostname -I (Linux)
const LAPTOP_IP   = '192.168.43.65'   // ← UPDATE THIS
const BACKEND_URL = `http://${LAPTOP_IP}:8080`

const get  = (path) => fetch(`${BACKEND_URL}${path}`, { timeout: 4000 }).then(r => r.json())
const post = (path, body) => fetch(`${BACKEND_URL}${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
}).then(r => r.json())

export const getState    = () => get('/api/state')
export const getETA      = () => get('/api/eta')
export const acceptCase  = (caseId, driverId = 'D001') =>
  post('/api/driver/accept', { case_id: caseId, driver_id: driverId })
```

---

## 18. Language Support

```javascript
// src/i18n/en.js
export default {
  hello: 'Hello', available: 'AVAILABLE', waitingDispatch: 'Waiting for dispatch...',
  casesToday: 'Cases Today', hoursShift: 'Hours on Shift', distance: 'Distance',
  connected: 'Connected to SmartEVP+', reconnecting: 'Reconnecting...',
  dispatchAlert: 'DISPATCH ALERT', location: 'LOCATION', symptoms: 'SYMPTOMS',
  accept: 'ACCEPT DISPATCH', decline: 'Decline',
  smsAlsoSent: 'SMS backup also sent', back: 'Back',
}

// src/i18n/hi.js
export default {
  hello: 'नमस्ते', available: 'उपलब्ध', waitingDispatch: 'डिस्पैच का इंतज़ार...',
  casesToday: 'आज के केस', hoursShift: 'शिफ्ट घंटे', distance: 'दूरी',
  connected: 'SmartEVP+ से जुड़ा', reconnecting: 'पुनः जोड़ रहा है...',
  dispatchAlert: 'डिस्पैच अलर्ट', location: 'स्थान', symptoms: 'लक्षण',
  accept: 'स्वीकार करें', decline: 'अस्वीकार',
  smsAlsoSent: 'SMS बैकअप भेजा गया', back: 'वापस',
}

// src/i18n/kn.js
export default {
  hello: 'ನಮಸ್ಕಾರ', available: 'ಲಭ್ಯ', waitingDispatch: 'ಡಿಸ್ಪ್ಯಾಚ್ ಗಾಗಿ ಕಾಯುತ್ತಿದ್ದೇನೆ...',
  casesToday: 'ಇಂದಿನ ಕೇಸ್‌ಗಳು', hoursShift: 'ಶಿಫ್ಟ್ ಗಂಟೆಗಳು', distance: 'ದೂರ',
  connected: 'SmartEVP+ ಗೆ ಸಂಪರ್ಕಿತ', reconnecting: 'ಮರು-ಸಂಪರ್ಕಿಸುತ್ತಿದ್ದೇನೆ...',
  dispatchAlert: 'ಡಿಸ್ಪ್ಯಾಚ್ ಎಚ್ಚರಿಕೆ', location: 'ಸ್ಥಳ', symptoms: 'ರೋಗಲಕ್ಷಣಗಳು',
  accept: 'ಸ್ವೀಕರಿಸಿ', decline: 'ನಿರಾಕರಿಸು',
  smsAlsoSent: 'SMS ಬ್ಯಾಕಪ್ ಕಳುಹಿಸಲಾಗಿದೆ', back: 'ಹಿಂದೆ',
}
```

```javascript
// src/context/LanguageContext.js
import { createContext, useContext, useState } from 'react'
import en from '../i18n/en'
import hi from '../i18n/hi'
import kn from '../i18n/kn'

const strings = { en, hi, kn }
const Ctx = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')
  const t = (key) => strings[language]?.[key] ?? strings.en[key] ?? key
  return <Ctx.Provider value={{ t, language, setLanguage }}>{children}</Ctx.Provider>
}

export const useLanguage = () => useContext(Ctx)
```

---

## 19. Expo Go — Demo Setup

### Before the Demo

1. Install **Expo Go** from Play Store on friend's phone
2. Ensure friend's phone is on the **same hotspot** as Laptop 1
3. Update `LAPTOP_IP` in `src/api.js` to Laptop 1's hotspot IP
4. In the `smartevp-driver/` folder on your laptop: `npx expo start`
5. QR code appears — scan it with Expo Go on friend's phone
6. App opens, select **Ravi Kumar (AMB-001)**
7. Home screen shows **AVAILABLE** in green
8. Keep this on the table, screen facing judges

### Finding Laptop 1's IP

```bash
# Mac:
ipconfig getifaddr en0

# Windows:
ipconfig | findstr IPv4

# Linux:
hostname -I
```

Example result: `192.168.43.65` → update `src/api.js`

### If QR Code Doesn't Scan

```bash
# Use tunnel mode (works across different networks):
npx expo start --tunnel
```

---

## 20. Build Priority Order

| # | What | Est. Time | After This |
|---|------|-----------|-----------|
| 1 | Project + navigation + theme + fonts | 30 min | App boots, fonts load |
| 2 | DriverContext + LanguageContext (EN only) | 20 min | Contexts working |
| 3 | `useDispatch` polling hook + `api.js` | 25 min | Data flows, console verified |
| 4 | Splash + Login screens | 30 min | Can select driver |
| 5 | **Home screen** (idle state) | 45 min | Shows AVAILABLE, connects
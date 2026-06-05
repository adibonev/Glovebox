# Публикуване на мобилното (iOS + Android) — Glovebox

Тъй като разработваш на **Windows**, билдовете минават през **EAS Build** (облачни builders на
Expo — включително **macOS за iOS**, така че Mac не ти трябва). Аз не мога да пусна билдовете
вместо теб — те искат твоите акаунти, 2FA и подписи. Този документ е точната последователност.

---

## 0. Предпоставки (еднократно)

| Какво | Цена | Линк |
| --- | --- | --- |
| **Expo акаунт** | безплатно (облачните билдове имат месечна безплатна квота, после се плаща) | <https://expo.dev> |
| **Apple Developer Program** | **99 $/година** | <https://developer.apple.com/programs/> |
| **Google Play Console** | **25 $ еднократно** | <https://play.google.com/console/signup> |
| **EAS CLI** | `npm i -g eas-cli` | — |

> Bundle ID-тата вече са зададени: iOS `com.glovebox.app`, Android `com.glovebox.app`.

---

## 1. Свържи проекта с EAS (еднократно)

```powershell
eas login
cd "apps/mobile"
eas init          # създава EAS проект и записва extra.eas.projectId в app.json
```

## 2. Env променливи за билда

Облачният билд **не чете** `apps/mobile/.env.local` (git-ignored, не се качва). Затова добави
двете публични Supabase стойности като **EAS environment variables** (anon ключът е публичен —
безопасно е да е в приложението; RLS пази данните):

```powershell
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xclqfebkmebageqnamvp.supabase.co" --environment production --environment preview --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon ключа от .env.local>" --environment production --environment preview --visibility plaintext
```

(Или ги добави през EAS dashboard → Project → Environment variables.)

---

## 3. Тествай преди билд

```powershell
pnpm --filter mobile start         # Expo Go: сканирай QR с телефона
```

По избор — вътрешен билд за инсталиране на реално устройство преди магазина:

```powershell
eas build --profile preview --platform android   # дава .apk за директна инсталация
```

---

## 4. Production билдове

```powershell
eas build --profile production --platform android   # → .aab за Google Play
eas build --profile production --platform ios       # → .ipa; EAS сам прави сертификати/profiles
```

При iOS EAS ще те преведе през Apple вход и ще създаде подписите автоматично.
`autoIncrement` + `appVersionSource: remote` означава, че build номерата растат сами при всеки билд.

---

## 5. Качване в магазините

```powershell
eas submit --profile production --platform android   # иска Google service-account JSON (еднократно)
eas submit --profile production --platform ios        # иска App Store Connect API key или Apple вход
```

- **Android service account:** Google Play Console → Setup → API access → създай service account →
  свали JSON. EAS ще го поиска веднъж.
- **iOS:** App Store Connect → Users and Access → Integrations → App Store Connect API → ключ.

---

## 6. Материали за обявата в магазина (попълват се в конзолите, не в кода)

- **Икона** ✅ вече генерирана (`assets/icon.png`).
- **Екранни снимки** — от Expo Go или симулатор (iPhone 6.7" + 5.5"; Android phone). Задължителни.
- **Описание + ключови думи** (на български).
- **Политика за поверителност (URL)** ✅ — `https://www.glovebox.bg/privacy` (вече я имаш в уеб-а).
- **Категория:** напр. „Productivity" / „Auto & Vehicles".
- **Възрастов рейтинг** (попълва се с въпросник).
- iOS **App Privacy** въпросник (какви данни събираш: имейл, данни за автомобила).

---

## ⚠️ Важно преди ревю

1. **App Store Guideline 4.2 (минимална функционалност).** Apple често отхвърля приложения,
   които само *показват* данни и пращат към уеб. В момента мобилното е **само за преглед** —
   добавяне/редакция на коли и услуги е само в уеб. Преди iOS подаване силно препоръчвам да
   добавим **добавяне/редакция на коли и услуги** в мобилното, за да мине ревюто.
2. **Apple Sign-In е задължителен**, ако добавим Google/социален вход на iOS. Засега има само
   имейл вход (ОК за подаване). Ако сложим Google, трябва и Apple Sign-In.
3. **Push нотификации** (Pro функция) още не са вградени — идват в отделна под-фаза
   (`expo-notifications` + APNs/FCM). Не са блокер за първо подаване.

---

## Накратко какво остава по мобилното (преди реален магазин)
- [ ] Добавяне/редакция на коли и услуги в мобилното (за 4.2 + реална стойност).
- [ ] (по избор) Apple + Google Sign-In (Apple Sign-In задължителен при социален вход).
- [ ] (Pro) Push нотификации.
- [ ] Брандови шрифтове (Fraunces/Hanken чрез `expo-font`).
- [ ] Екранни снимки + текстове за обявите.

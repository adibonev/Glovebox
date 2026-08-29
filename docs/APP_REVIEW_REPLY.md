# Отговор към App Review — Guideline 2.1 (Information Needed)

> Копирай текста отдолу в **App Store Connect → App Review → Reply**. Не е отказ — искат
> информация, за да продължат ревюто. Точка 1 (записът на екрана) е твоя; останалото е готово.
>
> **Преди да пратиш:** замени `<<МОДЕЛ>>` и `<<iOS ВЕРСИЯ>>` с реалните.

---

## Записът на екрана — какво да покажеш

Apple иска **едно видео от физическо устройство** (не симулатор), което минава през основния
поток. Задължително трябва да включва регистрация, вход и изтриване на акаунт.

Направи го така — един непрекъснат запис, 2–3 минути:

1. Отвори приложението на екрана за вход
2. **Регистрирай нов акаунт** (истински имейл, който ползваш — не демо акаунта)
3. Влез с него
4. Добави автомобил — марка, модел, година, регистрационен номер
5. Добави услуга — например Гражданска отговорност с дата
6. Прикачи документ (какъвто и да е PDF или снимка)
7. Отиди на „Напомняния" — покажи настройката на дните
8. Покажи **промпта за известия**, ако изскочи (Apple изрично пита за него)
9. Профил → **Изтрий акаунта** → мини през двете потвърждения → покажи, че те връща на входа

Записване: Settings → Control Centre → добави Screen Recording, после плъзгаш от горния десен
ъгъл. Видеото се прикача в полето Attachment на отговора.

**Не използвай `appreview@glovebox.bg` за изтриването** — това ще заличи демо данните, които
ревюърът ползва.

---

## Текстът за отговора (на английски)

```
Thank you for the review. Below is the information you requested.

1. SCREEN RECORDING
Attached. It was captured on a physical device and shows the complete user
flow: new account registration, sign-in, adding a vehicle, adding a service
record, attaching a document, the reminder settings, the notification
permission prompt, and the in-app account deletion flow from start to finish.

2. DEVICES AND OPERATING SYSTEMS TESTED
iPhone <<МОДЕЛ>> running iOS <<iOS ВЕРСИЯ>>, installed through TestFlight.

3. WHAT THE APP DOES, AND FOR WHOM
Glovebox is a private record-keeping and reminder tool for car owners in
Bulgaria.

The problem it solves: a Bulgarian driver must keep several unrelated
recurring obligations valid at all times - Civil Liability insurance
("Гражданска отговорност"), Casco insurance, the road vignette, the annual
roadworthiness inspection, vehicle tax, and a valid fire extinguisher. Each
has its own expiry date, each is issued by a different institution, and
nothing brings them together. Letting one lapse is a fineable offence; an
expired Civil Liability policy alone carries a fine many times the value of
this app.

The value it provides: the user records each expiry date once. The app derives
a status for every obligation (valid / expiring soon / expired), shows the
most urgent one on the dashboard, and notifies the user before each one
lapses. It also totals what the car costs its owner over time.

Target audience: private car owners in Bulgaria, often with more than one car
in the household. The app is free, with no in-app purchases and no
subscriptions.

4. HOW TO SET UP AND ACCESS THE MAIN FEATURES
Sign in with the demo account provided in App Review Information:
  user: appreview@glovebox.bg
It is pre-populated with two vehicles and twelve records so that every state
is visible immediately.

The five tabs at the bottom of the screen, left to right:
  - "Табло" (Dashboard): the most urgent deadline as a gauge, counts of valid
    / expiring / expired, and the list of items needing attention.
  - "Автомобили" (Vehicles): the two demo cars. Tap a car to see all of its
    records, colour-coded: green = valid, amber = expiring soon, red =
    expired. "+ Добави услуга" adds a record; "+ Добави автомобил" adds a car.
  - "Документи" (Documents): files the user attached to a record. Attaching a
    file is optional and is done from the record form ("Прикачи файл").
  - "Напомняния" (Reminders): how many days before expiry to be notified, per
    type of obligation.
  - "Профил" (Profile): name, password, sign out, and account deletion.

Account deletion (Guideline 5.1.1(v)): open "Профил", scroll to the bottom and
tap "Изтрий акаунта" in the red-outlined section. It confirms twice, then
permanently deletes the account, all vehicles, records and uploaded files.

No sample files are needed - any PDF or image can be attached.

5. EXTERNAL SERVICES USED
  - Supabase (supabase.com): authentication (e-mail/password, Sign in with
    Apple, Sign in with Google), the database holding the user's vehicles and
    records, and encrypted storage for uploaded documents. This is the only
    third-party SDK bundled in the app.
  - Sign in with Apple and Google OAuth, both through Supabase.
  - Expo Push Notification Service: delivery of reminder notifications.
  - Resend (resend.com): transactional reminder e-mails, sent from our own
    server, not from the app.
  - Our own backend at www.glovebox.bg: one endpoint, /api/account/delete,
    which the in-app deletion calls (deleting an account requires a privileged
    key that must never ship inside an app).

The app contains no advertising SDKs, no analytics or tracking SDKs, no AI or
machine-learning services, and no payment processors. There are no in-app
purchases and no subscriptions in this version.

6. REGIONAL DIFFERENCES
There are none. The app behaves identically in every region: same features,
same content, no geo-gating and no region-specific behaviour. The interface is
in Bulgarian only and the categories of obligation are specific to Bulgarian
law, so the app is practically useful only to drivers in Bulgaria. It is
nevertheless available in all territories so that Bulgarians living abroad,
whose Apple ID belongs to another storefront, can still install it.

7. REGULATED INDUSTRY
The app does not operate in a regulated industry and requires no licence or
permit.

Glovebox is not an insurance provider, broker, agent, or comparison service.
It does not sell, quote, arrange, underwrite, renew or process insurance or
any other financial product, and it takes no payments of any kind. It is not
connected to any insurer, government registry or payment system.

The user manually types in dates that appear on documents they already hold.
The app stores those dates for that user alone and reminds them before they
expire - the same thing a calendar entry would do. No Bulgarian or EU licence
is required for this.

Please let me know if anything else would help the review.
```

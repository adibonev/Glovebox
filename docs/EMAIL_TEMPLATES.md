# Имейл шаблони за Supabase Auth

Копирай всеки шаблон в **Supabase → Authentication → Emails → Templates**. Всеки има
собствено поле Subject и тяло.

Работят пълноценно само след като е включен custom SMTP през Resend (домейнът `glovebox.bg`
е verified), иначе имейлите пак тръгват от адрес на Supabase.

**Защо са таблици и inline стилове:** имейл клиентите не поддържат външен CSS, flexbox или
grid, а Gmail изрязва `<style>` блоковете. Затова оформлението е с таблици — неприятно за
четене, но е единственото, което изглежда еднакво навсякъде. По същата причина шрифтът е
Georgia: марката е Fraunces, но собствени шрифтове не се зареждат в имейл, а Georgia е
най-близката серифна, която я има на всяко устройство.

---

## 1. Confirm signup — потвърждаване на регистрация

**Subject**

```
Потвърди имейла си за Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Добре дошъл в Glovebox</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Остава една стъпка. Потвърди имейла си и започваш да следиш сроковете на колата си — гражданска отговорност, винетка, технически преглед и всичко останало.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#14503A;color:#F4F1EA;text-decoration:none;padding:14px 30px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;">Потвърди имейла</a>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A928C;line-height:1.6;">
          Ако бутонът не работи, отвори този адрес:<br>
          <a href="{{ .ConfirmationURL }}" style="color:#C4954C;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не си се регистрирал в Glovebox? Просто изтрий този имейл — без потвърждение нищо не се случва.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 2. Reset password — забравена парола

**Subject**

```
Нова парола за Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Смяна на паролата</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Получихме заявка да смениш паролата си. Натисни бутона и си избери нова.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#14503A;color:#F4F1EA;text-decoration:none;padding:14px 30px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;">Задай нова парола</a>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A928C;line-height:1.6;">
          Ако бутонът не работи, отвори този адрес:<br>
          <a href="{{ .ConfirmationURL }}" style="color:#C4954C;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не си искал нова парола? Игнорирай този имейл — старата остава валидна.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 3. Change Email Address — смяна на имейл

**Subject**

```
Потвърди новия си имейл за Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Нов имейл адрес</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Заяви смяна на имейла за профила си от {{ .Email }} на {{ .NewEmail }}. Потвърди от новия адрес, за да влезе в сила.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#14503A;color:#F4F1EA;text-decoration:none;padding:14px 30px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;">Потвърди новия имейл</a>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A928C;line-height:1.6;">
          Ако бутонът не работи, отвори този адрес:<br>
          <a href="{{ .ConfirmationURL }}" style="color:#C4954C;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не си заявявал смяна? Игнорирай този имейл и провери паролата си.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 4. Magic Link — вход с линк

Не се ползва в момента (входът е с парола, Google и Apple). Ако някога го включиш, вземи
шаблона за забравена парола и смени заглавието на „Вход в Glovebox", текста на „Натисни
бутона, за да влезеш в профила си", а бутона на „Влез".

---

## Как да ги провериш

Регистрирай се с истински адрес и виж:

1. Подателят е **Glovebox &lt;no-reply@glovebox.bg&gt;**, не Supabase
2. Тъмното оформление се показва правилно в Gmail и в Mail на iPhone
3. Линкът от телефон отваря **приложението**, не сайта — това работи само след като
   `glovebox://auth-callback` е добавен в Redirect URLs и излезе новият билд с
   [lib/authLink.ts](../apps/mobile/lib/authLink.ts)

Тъмният фон се показва както е зададен в Gmail и Apple Mail. Някои версии на Outlook обръщат
цветовете в тъмна тема — ако там излезе странно, има смисъл да се направи светъл вариант.

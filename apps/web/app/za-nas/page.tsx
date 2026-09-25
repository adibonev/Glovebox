import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { OperatorDetails } from "@/components/OperatorDetails";

export const metadata: Metadata = {
  title: "За нас · Glovebox",
  description: "Кой прави Glovebox и какво обещаваме за данните ти.",
};

/** Who makes Glovebox, why, and what it promises. Short on purpose. */
export default function AboutPage() {
  return (
    <LegalPage title="За нас">
      <p>
        Glovebox се прави в България, за шофьори в България. Полицата, талонът и бележката от
        сервиза стоят в жабката, а датите им никой не помни. Затова приложението помни вместо теб
        и ти пише навреме.
      </p>

      <h2>Какво обещаваме</h2>
      <ul>
        <li>Безплатно е. Нямаме скрити такси и не искаме карта.</li>
        <li>Данните ти стоят в Европейския съюз и не се продават на никого.</li>
        <li>Снимката на талона или полицата се разчита на телефона и не се качва никъде.</li>
        <li>Изтриваш акаунта си от профила с едно натискане и с него изчезва всичко.</li>
      </ul>

      <h2>Кой стои зад Glovebox</h2>
      <OperatorDetails />
      <p>
        Пиши ни за всичко: грешка, идея, срок, който липсва. Отговаряме лично.
      </p>
    </LegalPage>
  );
}

import { OPERATOR } from "@/lib/operator";

/** The provider's details as a list: name and legal form, address, e-mail, phone, ЕИК. */
export function OperatorDetails() {
  return (
    <ul>
      <li>
        <strong>{OPERATOR.name}</strong>, {OPERATOR.kind}
      </li>
      {OPERATOR.companyId && <li>ЕИК {OPERATOR.companyId}</li>}
      {OPERATOR.address && <li>Адрес: {OPERATOR.address}</li>}
      <li>
        Имейл: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
      </li>
      {OPERATOR.phone && <li>Телефон: {OPERATOR.phone}</li>}
    </ul>
  );
}

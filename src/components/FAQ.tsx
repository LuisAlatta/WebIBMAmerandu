/**
 * Acordeón de una pregunta abierta a la vez, hidratado desde FAQSection.astro.
 * El panel permanece montado para animar 0fr → 1fr en el CSS de FAQSection;
 * aria-hidden e inert lo excluyen de interacción al cerrar. No usar hidden ni
 * renderizado condicional: impedirían animar suavemente la altura de cierre.
 */
import { useId, useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "¿Quién puede participar del club de lectura?",
    answer:
      "Cualquier persona interesada en la literatura y el pensamiento latinoamericano.",
  },
  {
    question: "¿Con qué frecuencia se realizan los encuentros?",
    answer:
      "Los encuentros se realizan una vez al mes, acordando previamente la fecha y el horario.",
  },
  {
    question: "¿Los encuentros son presenciales o virtuales?",
    answer:
      "Los encuentros se realizan de manera virtual, lo que permite la participación de personas desde distintos lugares y facilita el acceso al club de lectura.",
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  const questionId = `${id}-question`;
  const answerId = `${id}-answer`;

  return (
    <div className="faq-item">
      <h3>
        <button
          type="button"
          id={questionId}
          onClick={onToggle}
          className="faq-question"
          aria-expanded={isOpen}
          aria-controls={answerId}
        >
          <span>{item.question}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="faq-chevron"
            aria-hidden="true"
          >
            <path d="m5 9 7 6 7-6" />
          </svg>
        </button>
      </h3>
      <div
        id={answerId}
        role="region"
        aria-labelledby={questionId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        data-open={isOpen}
        className="faq-answer"
      >
        <div className="faq-answer-inner"><p>{item.answer}</p></div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <div className="faq-accordion">
      {faqs.map((faq) => (
        <AccordionItem
          key={faq.question}
          item={faq}
          isOpen={openQuestion === faq.question}
          onToggle={() => setOpenQuestion(openQuestion === faq.question ? null : faq.question)}
        />
      ))}
    </div>
  );
}

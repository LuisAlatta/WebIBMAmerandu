import { useState } from "react";

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
  return (
    <div className="border-b border-verde-dark/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 px-6 text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-base sm:text-lg font-semibold text-verde-dark pr-4 group-hover:text-verde-medio transition-colors">
          {item.question}
        </span>
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full bg-verde-dark/10 flex items-center justify-center transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#055B3D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-6 pb-5 text-texto leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-lg shadow-verde-dark/5 overflow-hidden">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.question}
            item={faq}
            isOpen={openQuestion === faq.question}
            onToggle={() => setOpenQuestion(openQuestion === faq.question ? null : faq.question)}
          />
        ))}
      </div>
    </div>
  );
}

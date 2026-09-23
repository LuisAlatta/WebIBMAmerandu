/**
 * Isla React de club/voluntariado, hidratada con client:visible en ContactSection.
 * React Hook Form valida los campos; intl-tel-input normaliza el teléfono.
 * Los hashes contact-tab-* seleccionan la pestaña desde cualquier CTA de la web.
 * Solo envía datos a /api/contact: remitente, destinatarios y token viven en servidor.
 * El CV opcional se convierte a base64 puro para el contrato JSON del gateway.
 * Un fallo conserva los datos y el archivo seleccionado para volver a intentar.
 */
import { Fragment, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, ArrowUpToLine, Check } from "lucide-react";
import intlTelInput from "intl-tel-input";
import type { Iso2, Iti } from "intl-tel-input";
import { es as spanish } from "intl-tel-input/locale";
import "intl-tel-input/styles";
import "../styles/contact-form.css";

type FormType = "club" | "volunteer";
const submissionError = "Hubo un problema al enviar tu solicitud. Intenta nuevamente en un momento; tus datos siguen en el formulario.";
interface ContactFormData {
  nombre: string;
  pais: string;
  email: string;
  telefono: string;
  edad?: number;
  experiencia?: string;
  cv?: FileList;
}

const countries: Array<{ name: string; code: Iso2 }> = [
  { name: "Argentina", code: "ar" },
  { name: "Bolivia", code: "bo" },
  { name: "Brasil", code: "br" },
  { name: "Chile", code: "cl" },
  { name: "Colombia", code: "co" },
  { name: "Costa Rica", code: "cr" },
  { name: "Cuba", code: "cu" },
  { name: "Ecuador", code: "ec" },
  { name: "El Salvador", code: "sv" },
  { name: "Guatemala", code: "gt" },
  { name: "Haití", code: "ht" },
  { name: "Honduras", code: "hn" },
  { name: "México", code: "mx" },
  { name: "Nicaragua", code: "ni" },
  { name: "Panamá", code: "pa" },
  { name: "Paraguay", code: "py" },
  { name: "Perú", code: "pe" },
  { name: "Puerto Rico", code: "pr" },
  { name: "República Dominicana", code: "do" },
  { name: "Uruguay", code: "uy" },
  { name: "Venezuela", code: "ve" },
];
const tabs = [
  { value: "club" as const, label: "Quiero unirme al club" },
  { value: "volunteer" as const, label: "Quiero ser voluntario" },
];

export default function ContactForm() {
  const [formType, setFormType] = useState<FormType>("volunteer");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const phoneInput = useRef<HTMLInputElement | null>(null);
  const phoneInstance = useRef<Iti | null>(null);
  const successHeading = useRef<HTMLHeadingElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const submittingRef = useRef(false);
  const volunteer = formType === "volunteer";
  const { register, handleSubmit, watch, setValue, clearErrors, reset, formState: { errors, isSubmitting } } =
    useForm<ContactFormData>({ shouldUnregister: true, defaultValues: { nombre: "", email: "", telefono: "", pais: "" } });

  useEffect(() => {
    const input = phoneInput.current;
    if (!input || submitted) return;
    const instance = intlTelInput(input, {
      initialCountry: "pe",
      separateDialCode: true,
      // La librería actualiza el ejemplo al cargar utils y al cambiar de país.
      placeholderNumberPolicy: "AGGRESSIVE",
      showFlags: true,
      countryNameLocale: "es",
      uiTranslations: spanish,
      loadUtils: () => import("intl-tel-input/utils"),
    });
    phoneInstance.current = instance;
    // Handle a loading failure during validation rather than allowing an unhandled rejection.
    void instance.promise.catch(() => {});
    const syncCountry = () => setValue("telefono", input.value, { shouldValidate: false });
    input.addEventListener("countrychange", syncCountry);
    return () => {
      input.removeEventListener("countrychange", syncCountry);
      instance.destroy();
      phoneInstance.current = null;
    };
  }, [submitted, setValue]);

  useEffect(() => {
    submittingRef.current = isSubmitting;
    phoneInstance.current?.setDisabled(isSubmitting);
  }, [isSubmitting]);

  useEffect(() => {
    const selectLinkedForm = (hash: string) => {
      const next = hash === "#contact-tab-club" ? "club"
        : hash === "#contact-tab-volunteer" ? "volunteer" : null;
      if (!next || submittingRef.current) return;
      setFormType(next);
      clearErrors();
      setErrorMsg(null);
      setSubmitted(false);
    };
    const onHashChange = () => selectLinkedForm(window.location.hash);
    // Repeated clicks must also work when the URL already has the target hash.
    const onLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) {
        selectLinkedForm(url.hash);
      }
    };
    // Reads links followed before this client:visible island hydrated.
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onLinkClick);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onLinkClick);
    };
  }, [clearErrors]);

  useEffect(() => {
    if (submitted) successHeading.current?.focus();
  }, [submitted]);

  const phoneRegistration = register("telefono", {
    required: "Ingresa tu número de teléfono.",
    validate: async () => {
      const instance = phoneInstance.current;
      if (!instance) return "El campo de teléfono se está cargando. Intenta nuevamente.";
      try {
        await instance.promise;
        return instance.isValidNumber() === true || "Ingresa un número válido para el prefijo seleccionado.";
      } catch {
        return "No se pudo cargar la validación del teléfono. Recarga la página e intenta nuevamente.";
      }
    },
  });

  const selectedFile = watch("cv")?.[0];
  const fieldError = (name: keyof ContactFormData) => errors[name] && (
    <p id={`contact-${name}-error`} className="contact-field-error" role="alert">{errors[name]?.message}</p>
  );
  const fieldAccessibility = (name: keyof ContactFormData) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });

  const changeForm = (next: FormType) => {
    if (isSubmitting || next === formType) return;
    setFormType(next);
    clearErrors();
    setErrorMsg(null);
    setSubmitted(false);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - index;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault();
    changeForm(tabs[next].value);
    tabRefs.current[next]?.focus();
  };

  const onSubmit = async (data: ContactFormData) => {
    setErrorMsg(null);
    const payload = {
      formType,
      nombre: data.nombre.trim(),
      email: data.email.trim(),
      pais: data.pais,
      telefono: phoneInstance.current?.getNumber() || data.telefono,
      ...(volunteer ? { edad: data.edad, experiencia: data.experiencia?.trim() || "" } : {}),
    };

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const file = volunteer ? data.cv?.[0] : undefined;
      let attachment: Array<{ name: string; content: string }> | undefined;
      if (file) {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string" || !result.includes(";base64,")) {
              reject(new Error("file-read-failed"));
              return;
            }
            resolve(result.slice(result.indexOf(",") + 1));
          };
          reader.onerror = () => reject(new Error("file-read-failed"));
          reader.onabort = () => reject(new Error("file-read-aborted"));
          reader.readAsDataURL(file);
        });
        attachment = [{ name: file.name, content }];
      }
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...(attachment ? { attachment } : {}) }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true) {
        const messages: Record<string, string> = {
          INVALID_INPUT: "Revisa los datos del formulario; alguno no tiene un formato válido.",
          BODY_TOO_LARGE: "Tu solicitud es demasiado grande. Reduce el texto o el tamaño del CV e intenta nuevamente.",
          INVALID_ATTACHMENT: "Revisa el CV: debe ser un archivo PDF, DOC o DOCX válido, no vacío y de hasta 5 MB.",
        };
        setErrorMsg(messages[result?.code] || submissionError);
        return;
      }
      reset();
      setSubmitted(true);
    } catch {
      setErrorMsg(submissionError);
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const fields = {
    name: (
      <div className="contact-field field-name">
        <label htmlFor="contact-nombre">Nombres y Apellido</label>
        <input id="contact-nombre" autoComplete="name" placeholder="Tu nombre" {...register("nombre", { required: "Ingresa tu nombre y apellido.", validate: (value) => !!value.trim() || "Ingresa tu nombre y apellido." })} {...fieldAccessibility("nombre")} />
        {fieldError("nombre")}
      </div>
    ),
    country: (
      <div className="contact-field field-country">
        <label htmlFor="contact-pais">País</label>
        <select id="contact-pais" autoComplete="country-name" {...register("pais", { required: "Selecciona tu país." })} {...fieldAccessibility("pais")}>
          <option value="" disabled>Selecciona tu país</option>
          {countries.map(({ code, name }) => <option key={code} value={name}>{name}</option>)}
          <option value="Otro">Otro</option>
        </select>
        {fieldError("pais")}
      </div>
    ),
    age: volunteer ? (
      <div className="contact-field field-age">
          <label htmlFor="contact-edad">Edad</label>
          <input id="contact-edad" type="number" inputMode="numeric" min="18" step="1" placeholder="Tu edad"
            {...register("edad", { required: "Ingresa tu edad.", valueAsNumber: true, min: { value: 18, message: "Debes tener al menos 18 años." }, validate: (value) => Number.isInteger(value) || "Ingresa una edad entera." })}
            {...fieldAccessibility("edad")} />
          {fieldError("edad")}
        </div>
    ) : null,
    email: (
      <div className="contact-field field-email">
        <label htmlFor="contact-email">Email</label>
        <input id="contact-email" type="email" autoComplete="email" placeholder="tucorreo@outlook.com"
          {...register("email", { required: "Ingresa tu email.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un email válido." } })}
          {...fieldAccessibility("email")} />
        {fieldError("email")}
      </div>
    ),
    phone: (
      <div className="contact-field field-phone">
        <label htmlFor="contact-telefono">Número</label>
        <input id="contact-telefono" type="tel" autoComplete="tel"
          {...phoneRegistration}
          ref={(element) => { phoneRegistration.ref(element); phoneInput.current = element; }}
          {...fieldAccessibility("telefono")} />
        {fieldError("telefono")}
      </div>
    ),
  };
  const fieldOrder: Array<keyof typeof fields> = volunteer
    ? ['name', 'country', 'age', 'email', 'phone']
    : ['name', 'email', 'phone', 'country'];

  return (
    <div className="contact-form-area">
      <p className="contact-switch-label" id="contact-choice-label">Indícanos cómo deseas participar.</p>
      <div className="contact-tabs" role="tablist" aria-labelledby="contact-choice-label">
        {tabs.map(({ value, label }, index) => (
          <button
            key={value}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`contact-tab-${value}`}
            type="button"
            role="tab"
            aria-selected={formType === value}
            aria-controls="contact-panel"
            tabIndex={formType === value ? 0 : -1}
            disabled={isSubmitting}
            onClick={() => changeForm(value)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >{label}</button>
        ))}
      </div>
      <div className="contact-card" id="contact-panel" role="tabpanel" aria-labelledby={`contact-tab-${formType}`}>
        {submitted ? (
          <div className="contact-success" role="status">
            <Check size={46} aria-hidden="true" />
            <h3 ref={successHeading} tabIndex={-1}>¡Gracias por tu interés!</h3>
            <p>Recibimos tus datos. Nos pondremos en contacto contigo para contarte más sobre {volunteer ? "el voluntariado" : "los próximos encuentros de Amerandú"}.</p>
            <button type="button" className="contact-submit" onClick={() => setSubmitted(false)}>Enviar otra solicitud</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data" aria-busy={isSubmitting}>
            <h3 className="contact-form-title">{volunteer ? "Contribuye al crecimiento de Amerandú" : "Forma parte de la comunidad"}</h3>
            <p className="contact-form-description">{volunteer
              ? "Si te interesa apoyar nuestras iniciativas, completa el formulario y cuéntanos más sobre ti."
              : "Déjanos tus datos y te contaremos sobre los próximos encuentros y actividades de Amerandú"}</p>
            <fieldset className={`contact-fields ${volunteer ? "volunteer-fields" : "club-fields"}`} disabled={isSubmitting}>
              <legend className="contact-sr-only">Datos de {volunteer ? "voluntariado" : "participación"}</legend>
              {fieldOrder.map((name) => <Fragment key={name}>{fields[name]}</Fragment>)}
              {volunteer && (
                <>
                  <div className="contact-field field-experience">
                    <label htmlFor="contact-experiencia">Cuéntanos sobre tu experiencia y habilidades (opcional)</label>
                    <textarea id="contact-experiencia" rows={3} placeholder="Ej. comunicación, diseño, organización de eventos, etc." {...register("experiencia")} />
                  </div>
                  <div className="contact-field field-file">
                    <label className="contact-upload" htmlFor="contact-cv">
                      <ArrowUpToLine size={26} strokeWidth={1.3} aria-hidden="true" />
                      <span>{selectedFile?.name || "Seleccionar archivo"}</span>
                      <small id="contact-cv-hint">PDF, DOC o DOCX · máx. 5 MB · opcional</small>
                      <input id="contact-cv" type="file" accept=".pdf,.doc,.docx" aria-label="Adjuntar CV (opcional)"
                        {...register("cv", { validate: {
                          size: (files) => !files?.[0] || (files[0].size > 0 && files[0].size <= 5 * 1024 * 1024) || "El archivo debe contener datos y no superar los 5 MB.",
                          format: (files) => !files?.[0] || /\.(pdf|doc|docx)$/i.test(files[0].name) || "Selecciona un archivo PDF, DOC o DOCX.",
                        } })}
                        aria-invalid={!!errors.cv}
                        aria-describedby={errors.cv ? "contact-cv-hint contact-cv-error" : "contact-cv-hint"} />
                    </label>
                    {selectedFile && <button type="button" className="contact-remove-file" onClick={() => { setValue("cv", undefined, { shouldValidate: true }); const input = document.getElementById("contact-cv") as HTMLInputElement | null; if (input) input.value = ""; }}>Quitar archivo</button>}
                    {fieldError("cv")}
                  </div>
                </>
              )}
            </fieldset>
            {errorMsg && <p className="contact-send-error" role="alert">{errorMsg}</p>}
            <button type="submit" className="contact-submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando…" : "Enviar"} <ArrowRight size={20} aria-hidden="true" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

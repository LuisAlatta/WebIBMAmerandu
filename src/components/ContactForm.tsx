import { useForm } from "react-hook-form";
import { useState } from "react";

interface ContactFormData {
  nombre: string;
  edad: number;
  pais: string;
  email: string;
  telefono?: string;
  interes: string;
  encuentro?: string;
  cv?: FileList;
}

const paises = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Haití",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Puerto Rico",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
  "Otro",
];

const inputBase =
  "w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-texto placeholder:text-gray-400 focus:outline-none focus:border-amarillo focus:ring-2 focus:ring-amarillo/30 transition-all duration-200";
const labelBase = "block text-sm font-semibold text-verde-dark mb-1.5";
const errorBase = "text-rojo text-xs mt-1";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>();

  const cvFiles = watch("cv");
  const selectedFileName = cvFiles && cvFiles.length > 0 ? cvFiles[0].name : null;

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("_subject", `Nuevo contacto de Amerandú — ${data.interes}`);
      formData.append("_cc", "newluisalatta@gmail.com");
      formData.append("_template", "table");
      formData.append("_captcha", "false");
      formData.append("Nombre y Apellido", data.nombre);
      formData.append("Edad", String(data.edad));
      formData.append("País", data.pais);
      formData.append("Correo electrónico", data.email);
      formData.append("Teléfono", data.telefono || "No proporcionado");
      formData.append("Interés", data.interes);
      formData.append("Encuentro de interés", data.encuentro || "No especificado");

      if (data.cv && data.cv.length > 0) {
        formData.append("attachment", data.cv[0]);
      }

      const response = await fetch("https://formsubmit.co/ajax/ameranduclub@gmail.com", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        setErrorMsg("Hubo un problema al enviar el formulario. Por favor, intentá de nuevo.");
      }
    } catch {
      setErrorMsg("No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-verde-dark/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#055B3D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-verde-dark mb-4">
          ¡Gracias por tu interés!
        </h3>
        <p className="text-texto leading-relaxed">
          Nos alegra mucho que quieras formar parte de Amerandú, club de lectura
          y pensamiento latinoamericano. En breve nos pondremos en contacto
          contigo para brindarte más información sobre los encuentros, las
          lecturas y cómo participar. Mientras tanto, te invitamos a seguirnos en
          nuestras redes para conocer próximas actividades y novedades del club.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl max-w-2xl mx-auto"
      noValidate
    >
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Nombre */}
        <div className="sm:col-span-2">
          <label htmlFor="nombre" className={labelBase}>
            Nombre y Apellido *
          </label>
          <input
            id="nombre"
            type="text"
            placeholder="Tu nombre completo"
            className={inputBase}
            {...register("nombre", { required: "Este campo es obligatorio" })}
          />
          {errors.nombre && (
            <p className={errorBase}>{errors.nombre.message}</p>
          )}
        </div>

        {/* Edad */}
        <div>
          <label htmlFor="edad" className={labelBase}>
            Edad *
          </label>
          <input
            id="edad"
            type="number"
            placeholder="Tu edad"
            className={inputBase}
            {...register("edad", {
              required: "Este campo es obligatorio",
              min: { value: 18, message: "Debés tener al menos 18 años" },
              valueAsNumber: true,
            })}
          />
          {errors.edad && <p className={errorBase}>{errors.edad.message}</p>}
        </div>

        {/* País */}
        <div>
          <label htmlFor="pais" className={labelBase}>
            País *
          </label>
          <select
            id="pais"
            className={inputBase}
            {...register("pais", { required: "Seleccioná un país" })}
            defaultValue=""
          >
            <option value="" disabled>
              Seleccioná tu país
            </option>
            {paises.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.pais && <p className={errorBase}>{errors.pais.message}</p>}
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <label htmlFor="email" className={labelBase}>
            Correo electrónico *
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            className={inputBase}
            {...register("email", {
              required: "Este campo es obligatorio",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Ingresá un correo válido",
              },
            })}
          />
          {errors.email && <p className={errorBase}>{errors.email.message}</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="telefono" className={labelBase}>
            Teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            placeholder="+54 9 ..."
            className={inputBase}
            {...register("telefono")}
          />
        </div>

        {/* Interés */}
        <div>
          <label htmlFor="interes" className={labelBase}>
            Interés *
          </label>
          <select
            id="interes"
            className={inputBase}
            {...register("interes", { required: "Seleccioná una opción" })}
            defaultValue=""
          >
            <option value="" disabled>
              ¿Qué te gustaría?
            </option>
            <option value="Quiero participar">Quiero participar</option>
            <option value="Quiero recibir información">
              Quiero recibir información
            </option>
            <option value="Quiero ser voluntario/a">
              Quiero ser voluntario/a
            </option>
          </select>
          {errors.interes && (
            <p className={errorBase}>{errors.interes.message}</p>
          )}
        </div>

        {/* Encuentro */}
        <div className="sm:col-span-2">
          <label htmlFor="encuentro" className={labelBase}>
            ¿A qué encuentro te gustaría asistir?
          </label>
          <input
            id="encuentro"
            type="text"
            placeholder="Opcional"
            className={inputBase}
            {...register("encuentro")}
          />
        </div>

        {/* CV Upload */}
        <div className="sm:col-span-2">
          <label htmlFor="cv" className={labelBase}>
            Si deseás ser voluntario/a, agregá aquí tu CV
          </label>
          <label
            htmlFor="cv"
            className={`group flex flex-col items-center justify-center w-full px-6 py-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
              selectedFileName
                ? "border-verde-dark/40 bg-verde-dark/5"
                : "border-gray-200 bg-gray-50/50 hover:border-verde-dark/40 hover:bg-verde-dark/5"
            }`}
          >
            {selectedFileName ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#055B3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <polyline points="16 13 12 17 8 13" />
                  <line x1="12" y1="12" x2="12" y2="17" />
                </svg>
                <span className="text-sm font-semibold text-verde-dark truncate max-w-full">{selectedFileName}</span>
                <span className="text-xs text-verde-dark/60 mt-1">Clic para cambiar archivo</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-300 group-hover:text-verde-dark transition-colors mb-2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm font-medium text-verde-dark">Seleccionar archivo</span>
                <span className="text-xs text-gray-400 mt-1">PDF, DOC o DOCX — máx. 5 MB</span>
              </>
            )}
          </label>
          <input
            id="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            {...register("cv")}
          />
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mt-6 bg-rojo/10 border border-rojo/20 rounded-2xl px-5 py-3 text-center">
          <p className="text-rojo text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Submit */}
      <div className="mt-8 text-center">
        <button
          type="submit"
          disabled={submitting}
          className="bg-amarillo text-verde-dark px-10 py-3.5 rounded-full font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-amarillo/30 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
        >
          {submitting ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}

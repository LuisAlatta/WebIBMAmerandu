import { useForm } from "react-hook-form";
import { useState } from "react";

interface FormData {
  nombre: string;
  edad: number;
  pais: string;
  email: string;
  telefono?: string;
  interes: string;
  encuentro?: string;
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
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "YOUR_ACCESS_KEY_HERE",
          subject: `Nuevo contacto de Amerandú — ${data.interes}`,
          from_name: "Amerandú Web",
          to: "ameranduclub@gmail.com",
          "Nombre y Apellido": data.nombre,
          Edad: data.edad,
          País: data.pais,
          "Correo electrónico": data.email,
          Teléfono: data.telefono || "No proporcionado",
          Interés: data.interes,
          "Encuentro de interés": data.encuentro || "No especificado",
        }),
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

import { useState } from "react"
import { useNavigate } from "react-router-dom" 
import Banner from "../../assets/hero.png"
import "../../styles/Register.css"

function validatePassword(pwd) {
  return {
    minLength: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    specialCharacter: /[^A-Za-z0-9]/.test(pwd),
  }
}

function validateTelefono(tel) {
  return tel.replace(/\D/g, "").length === 10
}

const ERROR_MESSAGES = {
  EMAIL_ALREADY_EXISTS: "Ya existe una cuenta con ese email.",
  PASSWORDS_DONT_MATCH: "Las contraseñas no coinciden.",
  INVALID_PASSWORD: "La contraseña no cumple los requisitos.",
  INVALID_PHONE_LENGTH: "El teléfono debe tener 10 dígitos.",
}

const IconUser = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

const IconEmail = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
)

const IconPhone = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconLock = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconEye = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    contrasena: "",
    confirmacion: "",
  })

  const [apiError, setApiError] = useState(null)
  const [pwdValidation, setPwdValidation] = useState({
    minLength: false,
    uppercase: false,
    number: false,
    specialCharacter: false,
  })
  const [loading, setLoading] = useState(false)
  const [showContrasena, setShowContrasena] = useState(false)
  const [showConfirmacion, setShowConfirmacion] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setApiError(null)

    if (name === "contrasena") {
      setPwdValidation(validatePassword(value))
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setApiError(null)

    try {
      const res = await fetch("/api/usuarios/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (data.success) {
        navigate("/home")
      } else {
        if (data.errorCode === "INVALID_PASSWORD" && data.passwordValidation) {
          setPwdValidation(data.passwordValidation)
        }
        setApiError(data.errorCode)
      }
    } catch {
      setApiError(null)
    } finally {
      setLoading(false)
    }
  }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const telefonoValido = validateTelefono(form.telefono)

  const allValid =
    Object.values(pwdValidation).every(Boolean) &&
    form.contrasena === form.confirmacion &&
    form.nombre.trim() !== "" &&
    form.apellido.trim() !== "" &&
    emailValido &&
    telefonoValido

  return (
    <div className="register-container">
      <div className="register-header">
        <button className="back-btn" aria-label="Volver">←</button>
        <div>
          <h2>Crear Cuenta</h2>
          <p>Empezá a laburar o encontrar ayuda</p>
        </div>
      </div>

      <img src={Banner} alt="" />
      <h1>Súmate a la red de profesionales.</h1>

      <div className="input-wrapper">
        <span className="input-icon"><IconUser /></span>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
        />
      </div>

      <div className="input-wrapper">
        <span className="input-icon"><IconUser /></span>
        <input
          type="text"
          name="apellido"
          placeholder="Apellido"
          value={form.apellido}
          onChange={handleChange}
        />
      </div>

      <div className="input-wrapper">
        <span className="input-icon"><IconEmail /></span>
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
        />
      </div>


      {form.email.length > 0 && (
        <ul className="password-requirements">
          <li className={emailValido ? "ok" : "fail"}>
            {emailValido ? "✓" : "✗"} Email válido
          </li>
        </ul>
      )}

      <div className="input-wrapper">
        <span className="input-icon"><IconPhone /></span>
        <input
          type="tel"
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={handleChange}
        />
      </div>

      {form.telefono.length > 0 && (
        <ul className="password-requirements">
          <li className={telefonoValido ? "ok" : "fail"}>
            {telefonoValido ? "✓" : "✗"} 10 dígitos
          </li>
        </ul>
      )}

      <div className="password-wrapper">
        <span className="input-icon"><IconLock /></span>
        <input
          type={showContrasena ? "text" : "password"}
          name="contrasena"
          placeholder="Contraseña"
          value={form.contrasena}
          onChange={handleChange}
        />
        <button
          className="eye-btn"
          onClick={() => setShowContrasena(p => !p)}
          aria-label={showContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showContrasena ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>

      {form.contrasena.length > 0 && (
        <ul className="password-requirements">
          <li className={pwdValidation.minLength ? "ok" : "fail"}>
            {pwdValidation.minLength ? "✓" : "✗"} Mínimo 8 caracteres
          </li>
          <li className={pwdValidation.uppercase ? "ok" : "fail"}>
            {pwdValidation.uppercase ? "✓" : "✗"} Una mayúscula
          </li>
          <li className={pwdValidation.number ? "ok" : "fail"}>
            {pwdValidation.number ? "✓" : "✗"} Un número
          </li>
          <li className={pwdValidation.specialCharacter ? "ok" : "fail"}>
            {pwdValidation.specialCharacter ? "✓" : "✗"} Un carácter especial
          </li>
        </ul>
      )}

      <div className="password-wrapper">
        <span className="input-icon"><IconLock /></span>
        <input
          type={showConfirmacion ? "text" : "password"}
          name="confirmacion"
          placeholder="Confirmar contraseña"
          value={form.confirmacion}
          onChange={handleChange}
        />
        <button
          className="eye-btn"
          onClick={() => setShowConfirmacion(p => !p)}
          aria-label={showConfirmacion ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showConfirmacion ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>

      {form.confirmacion.length > 0 && (
        <ul className="password-requirements">
          <li className={form.contrasena === form.confirmacion ? "ok" : "fail"}>
            {form.contrasena === form.confirmacion ? "✓" : "✗"} Las contraseñas coinciden
          </li>
        </ul>
      )}

      {apiError && (
        <p className="error-message">{ERROR_MESSAGES[apiError]}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !allValid}
      >
        {loading ? "Registrando..." : "Siguiente"}
      </button>

      <p>¿Ya tenés cuenta? <button className="link-btn" onClick={() => navigate("/login")}>Iniciar sesión</button></p>
    </div>
  )
}
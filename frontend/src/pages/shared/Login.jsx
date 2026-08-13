import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "../../styles/Login.module.css"

const ERROR_MESSAGES = {
  EMAIL_NOT_FOUND: "No existe ninguna cuenta con ese email.",
  INVALID_PASSWORD: "La contraseña es incorrecta.",
  ROL_NO_SOPORTADO: "El inicio de sesión para trabajadores todavía no está disponible.",
  UNKNOWN: "Ocurrió un error. Intentá de nuevo.",
}

const IconBriefcase = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
)

const IconEmail = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
)

const IconLock = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const IconEye = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export default function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: "", contrasena: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setApiError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setApiError(null)

    try {
      const res = await fetch("/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (data.success) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("userId", data.userId)
        if (data.rol === "contratador") {
          navigate("/inicio")
        } else {
          setApiError("ROL_NO_SOPORTADO")
        }
      } else {
        setApiError(data.errorCode ?? "UNKNOWN")
      }
    } catch {
      setApiError("UNKNOWN")
    } finally {
      setLoading(false)
    }
  }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const allValid = emailValido && form.contrasena.length > 0

  return (
    <div className={styles.container}>

      <div className={styles.iconWrapper}>
        <IconBriefcase />
      </div>

      <h1 className={styles.title}>Bienvenido de nuevo</h1>
      <p className={styles.subtitle}>Iniciá sesión para continuar</p>

      <form onSubmit={handleSubmit}>

      <div className={styles.inputWrapper}>
        <span className={styles.inputIcon}>
          <IconEmail />
        </span>
        <input
          className={styles.input}
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          autoComplete="off"
        />
      </div>

      <div className={styles.inputWrapper}>
        <span className={styles.inputIcon}>
          <IconLock />
        </span>
        <input
          className={`${styles.input} ${styles.inputPassword}`}
          type={showPassword ? "text" : "password"}
          name="contrasena"
          placeholder="Contraseña"
          value={form.contrasena}
          onChange={handleChange}
          autoComplete="new-password"
        />
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setShowPassword(p => !p)}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>

      <div className={styles.forgotWrapper}>
        <button type="button" className={styles.forgotBtn}>¿Olvidaste tu contraseña?</button>
      </div>

      {apiError && (
        <p className={styles.errorMsg}>{ERROR_MESSAGES[apiError] ?? ERROR_MESSAGES.UNKNOWN}</p>
      )}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={loading || !allValid}
      >
        {loading ? "Iniciando sesión..." : "Iniciar sesión →"}
      </button>

      </form>

      <p className={styles.registerText}>
        ¿No tenés cuenta?{" "}
        <button type="button" className={styles.linkBtn} onClick={() => navigate("/registro")}>
          Registrarse
        </button>
      </p>

    </div>
  )
}

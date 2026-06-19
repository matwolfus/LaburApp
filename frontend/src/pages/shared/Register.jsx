import { useState } from "react"
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

const ERROR_MESSAGES = {
  EMAIL_ALREADY_EXISTS: "Ya existe una cuenta con ese email.",
  PASSWORDS_DONT_MATCH: "Las contraseñas no coinciden.",
  INVALID_PASSWORD: "La contraseña no cumple los requisitos.",
}

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
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
        console.log("Registro exitoso, userId:", data.userId)
        // navigate("/home")
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

  const allValid =
    Object.values(pwdValidation).every(Boolean) &&
    form.contrasena === form.confirmacion &&
    form.nombre.trim() !== "" &&
    form.apellido.trim() !== "" &&
    emailValido

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

      <input
        type="text"
        name="nombre"
        placeholder="Nombre"
        value={form.nombre}
        onChange={handleChange}
      />

      <input
        type="text"
        name="apellido"
        placeholder="Apellido"
        value={form.apellido}
        onChange={handleChange}
      />

      <input
        type="email"
        name="email"
        placeholder="Correo electrónico"
        value={form.email}
        onChange={handleChange}
      />

      <input
        type="password"
        name="contrasena"
        placeholder="Contraseña"
        value={form.contrasena}
        onChange={handleChange}
      />

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

      

      <input
        type="password"
        name="confirmacion"
        placeholder="Confirmar contraseña"
        value={form.confirmacion}
        onChange={handleChange}
      />

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

      <p>¿Ya tenés cuenta? <button className="link-btn">Iniciar sesión</button></p>
    </div>
  )
}
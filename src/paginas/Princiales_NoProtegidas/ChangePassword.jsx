"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Save, AlertCircle, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import fetchWithAuth from "../../utils/fetchWithAuth";

import "./Change.css";

const PasswordChange = () => {
  const [usuario, setUsuario] = useState(null);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchWithAuth("/api/me");
        if (!response.ok) throw new Error("Error al obtener el usuario");
        const data = await response.json();
        setUsuario(data);
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        setUsuario(null);
      }
    };

    fetchUser();
  }, []);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [validations, setValidations] = useState({
    length: false,
    specialChar: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const location = useLocation();
  const userId = location.state?.idUsuario || usuario?.idUsuario;
  const cambioForzado = location.state?.cambioForzado;

  const navigate = useNavigate();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"));
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const { newPassword } = formData;
    setValidations({
      length: newPassword.length >= 8,
      specialChar: /[!@#$%^&*()\-_=+{};:,<.>]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      match: newPassword === formData.confirmPassword && newPassword !== "",
    });

    setValidations({
      length: newPassword.length >= 8,
      specialChar: /[!@#$%^&*()\-_=+{};:,<.>]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      match: newPassword === formData.confirmPassword && newPassword !== "",
    });
  }, [formData.newPassword]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      const response = await fetchWithAuth("/api/usuarios/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.mensaje || "Error al cerrar sesión.");
      }

      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setError("Error al cerrar sesión. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const cambioForzado = location.state?.cambioForzado;
    const userIdForzado = location.state?.idUsuario;
    const idFinal = userIdForzado || userId;

    if (
      !formData.newPassword ||
      !formData.confirmPassword ||
      (!cambioForzado && !formData.currentPassword)
    ) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const allValid = Object.values(validations).every(Boolean);
    if (!allValid) {
      setError("La nueva contraseña no cumple con todos los requisitos");
      return;
    }

    if (!idFinal) {
      setError("No se ha detectado un ID de sesión válido.");
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (cambioForzado) {
        response = await fetchWithAuth(
          "/api/usuarios/cambiar-contrasena-forzada",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              idUsuario: idFinal,
              nuevaContrasena: formData.newPassword,
            }),
          }
        );
      } else {
        const passwordData = {
          oldPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        };

        response = await fetchWithAuth(
          `/api/usuarios/change-password/${idFinal}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(passwordData),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Error al cambiar la contraseña.");
      }

      const responseData = await response.json();

      if (responseData.mensaje.includes("actualizada")) {
        setSuccess(true);
        toast.success("Contraseña actualizada correctamente");

        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else {
        setError("Error al cambiar la contraseña.");
        toast.error("Error al cambiar la contraseña");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      setError(error.message || "Error al cambiar la contraseña.");
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`password-container ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <div className="password-content">
        <div className="password-header">
          <h2>Cambiar Contraseña</h2>
          <p className="password-subtitle">
            Actualiza tu contraseña para mantener tu cuenta segura
          </p>
        </div>

        {(error || success) && (
          <div className={`status-message ${error ? "error" : "success"}`}>
            <span className="status-icon">
              {error ? <AlertCircle size={20} /> : <Check size={20} />}
            </span>
            <span>{error || "¡Contraseña cambiada exitosamente!"}</span>
          </div>
        )}

        <div className="password-card">
          <form onSubmit={handleSubmit} className="password-form">
            {!cambioForzado && (
              <div className="form-group">
                <label htmlFor="currentPassword">
                  <Lock className="form-icon" />
                  <span>Contraseña Actual</span>
                </label>
                <div className="password-input-group">
                  <input
                    type={showPasswords.currentPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Ingresa tu contraseña actual"
                    required={!cambioForzado}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility("currentPassword")}
                    aria-label={
                      showPasswords.currentPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    disabled={isLoading}
                  >
                    {showPasswords.currentPassword ? (
                      <EyeOff className="icon" />
                    ) : (
                      <Eye className="icon" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="newPassword">
                <Lock className="form-icon" />
                <span>Nueva Contraseña</span>
              </label>
              <div className="password-input-group">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Ingresa tu nueva contraseña"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  aria-label={
                    showPasswords.newPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  disabled={isLoading}
                >
                  {showPasswords.newPassword ? (
                    <EyeOff className="icon" />
                  ) : (
                    <Eye className="icon" />
                  )}
                </button>
              </div>
              <small className="form-help">
                Debe tener al menos 8 caracteres, incluir mayúsculas,
                minúsculas, números y caracteres especiales
              </small>
              {formData.newPassword && (
                <div className="password-validation-feedback">
                  {!validations.length && (
                    <p className="validation-error">
                      La contraseña debe tener al menos 8 caracteres
                    </p>
                  )}
                  {!validations.uppercase && (
                    <p className="validation-error">
                      La contraseña debe incluir al menos una letra mayúscula
                    </p>
                  )}
                  {!validations.lowercase && (
                    <p className="validation-error">
                      La contraseña debe incluir al menos una letra minúscula
                    </p>
                  )}
                  {!validations.number && (
                    <p className="validation-error">
                      La contraseña debe incluir al menos un número
                    </p>
                  )}
                  {!validations.specialChar && (
                    <p className="validation-error">
                      La contraseña debe incluir al menos un carácter especial
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock className="form-icon" />
                <span>Confirmar Contraseña</span>
              </label>
              <div className="password-input-group">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirma tu nueva contraseña"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  aria-label={
                    showPasswords.confirmPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  disabled={isLoading}
                >
                  {showPasswords.confirmPassword ? (
                    <EyeOff className="icon" />
                  ) : (
                    <Eye className="icon" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && !validations.match && (
                <p className="password-mismatch">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel-password"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                <X className="btn-icon" />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                className="btn-save-password"
                disabled={
                  isLoading || !Object.values(validations).every(Boolean)
                }
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Save className="btn-icon" />
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChange;

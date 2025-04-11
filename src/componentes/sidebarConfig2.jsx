import { FiHome, FiUsers, FiSettings, FiHelpCircle } from 'react-icons/fi';
import { AiOutlineIdcard } from "react-icons/ai";
import { FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { BiLogIn } from "react-icons/bi";
import { SlOrganization } from "react-icons/sl";
import { VscOrganization } from "react-icons/vsc";
import fetchWithAuth from "../utils/fetchWithAuth";


export const menu={
    1: [
        { id: '/dashboard', icon: <FiHome />, label: 'Inicio' },
        {
              id: "usuarios",
              icon: <AiOutlineIdcard />, // Icono nuevo para Información Personal
              label: "Información Personal",
              subItems: [
                { id: "/administrarcuenta", label: "Datos personales" },
                { id: "/cambiarcontra", label: "Cambiar contraseña" },
              ],
            },
            {
              id: "sistema",
              icon: <FaMoneyBillWave />, // Icono nuevo para Pagos
              label: "Pagos",
              subItems: [
                { id: "/sistema/configuracion", label: "Créditos" },
                { id: "/ingresos", label: "Historial" },
              ],
            },
            {
              id: "ayuda",
              icon: <BiSupport />, // Icono nuevo para Ayuda
              label: "Ayuda",
            },
      ],
      2:[
        { id: '/home_org', icon: <FiHome />, label: 'Inicio' },
        {
              id: "usuarios",
              icon: <AiOutlineIdcard />, // Icono nuevo para Información Personal
              label: "Información Personal",
              subItems: [
                { id: "/administrarcuenta", label: "Datos personales" },
                { id: "/cambiarcontra", label: "Cambiar contraseña" },
              ],
            },
            {
              id: "sistema",
              icon: <FaMoneyBillWave />, // Icono nuevo para Pagos
              label: "Pagos",
              subItems: [
                { id: "/sistema/configuracion", label: "Créditos" },
                { id: "/ingresos", label: "Historial" },
              ],
            },
            {
              id: "ayuda",
              icon: <BiSupport />, // Icono nuevo para Ayuda
              label: "Ayuda",
            },
      ],
      3:[
        { id: '/home_area', icon: <FiHome />, label: 'Inicio' },
        {
              id: "usuarios",
              icon: <AiOutlineIdcard />, // Icono nuevo para Información Personal
              label: "Información Personal",
              subItems: [
                { id: "/administrarcuenta", label: "Datos personales" },
                { id: "/cambiarcontra", label: "Cambiar contraseña" },
              ],
            },
            {
              id: "sistema",
              icon: <FaMoneyBillWave />, // Icono nuevo para Pagos
              label: "Pagos",
              subItems: [
                { id: "/sistema/configuracion", label: "Créditos" },
                { id: "/ingresos", label: "Historial" },
              ],
            },
            {
              id: "ayuda",
              icon: <BiSupport />, // Icono nuevo para Ayuda
              label: "Ayuda",
            },
      ],
      4:[
        { id: '/home_depto', icon: <FiHome />, label: 'Inicio' },
        {
              id: "usuarios",
              icon: <AiOutlineIdcard />, // Icono nuevo para Información Personal
              label: "Información Personal",
              subItems: [
                { id: "/administrarcuenta", label: "Datos personales" },
                { id: "/cambiarcontra", label: "Cambiar contraseña" },
              ],
            },
            {
              id: "sistema",
              icon: <FaMoneyBillWave />, // Icono nuevo para Pagos
              label: "Pagos",
              subItems: [
                { id: "/sistema/configuracion", label: "Créditos" },
                { id: "/ingresos", label: "Historial" },
              ],
            },
            {
              id: "ayuda",
              icon: <BiSupport />, // Icono nuevo para Ayuda
              label: "Ayuda",
            },
      ],
      5:[
        { id: '/home_analista', icon: <FiHome />, label: 'Inicio' },
        {
              id: "usuarios",
              icon: <AiOutlineIdcard />, // Icono nuevo para Información Personal
              label: "Información Personal",
              subItems: [
                { id: "/administrarcuenta", label: "Datos personales" },
                { id: "/cambiarcontra", label: "Cambiar contraseña" },
              ],
            },
            {
              id: "sistema",
              icon: <FaMoneyBillWave />, // Icono nuevo para Pagos
              label: "Pagos",
              subItems: [
                { id: "/sistema/configuracion", label: "Créditos" },
                { id: "/ingresos", label: "Historial" },
              ],
            },
            {
              id: "ayuda",
              icon: <BiSupport />, // Icono nuevo para Ayuda
              label: "Ayuda",
            },
      ]

}
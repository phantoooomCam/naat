import { FiHome, FiUsers, FiSettings, FiHelpCircle } from 'react-icons/fi';
import { LuBookHeadphones } from "react-icons/lu";
import { SlOrganization } from "react-icons/sl";
import { VscOrganization } from "react-icons/vsc";
import { PiFolderUserDuotone } from "react-icons/pi";
import fetchWithAuth from "../utils/fetchWithAuth";


export const menu={
    1: [
        { id: '/dashboard', icon: <FiHome />, label: 'Inicio' },
        {
          id: 'usuarios',
          icon: <FiUsers />,
          label: 'Usuarios',
          subItems: [
            { id: '/gestion', label: 'Gestionar Usuarios' },
            { id: '/solicitudes', label: 'Solicitudes' }
          ]
        },
        {
          id: 'sistema',
          icon: <FiSettings />,
          label: 'Sistema',
          subItems: [
            { id: '/actividad', label: 'Actividad' },
            { id: '/ingresos', label: 'Ingresos' }
          ]
        },
        {
          id: 'organizaciones',
          icon: <FiHelpCircle />,
          label: 'Organizaciones',
          subItems: [
            { id: '/orga', label: 'Gestion Organización' },
            { id: '/area', label: 'Gestion Area' },
            { id: '/depto', label: 'Gestion Departamento' }
    
          ]
        },
      ],
      2:[
        { id: '/home_org', icon: <FiHome />, label: 'Inicio' },
        { id: '/gestion', icon: <FiUsers />, label: 'Gestion Usuarios' },
        {
          id: 'sistema',
          icon: <FiSettings />,
          label: 'Sistema',
          subItems: [
            { id: '/actividad', label: 'Actividad' },
            { id: '/ingresos', label: 'Ingresos' }
          ]
        },
        { id: '/area', icon: <SlOrganization />, label: 'Areas' },
        { id: '/depto', icon:<VscOrganization />, label: 'Departamenos' },
      ],
      3:[
        { id: '/home_area', icon: <FiHome />, label: 'Inicio' },
        { id: '/gestion', icon: <FiUsers />, label: 'Gestion Usuarios' },
        {
          id: 'sistema',
          icon: <FiSettings />,
          label: 'Sistema',
          subItems: [
            { id: '/actividad', label: 'Actividad' },
            { id: '/ingresos', label: 'Ingresos' }
          ]
        },
        { id: '/depto', icon:<VscOrganization />, label: 'Departamenos' },
        { id: '/casos', icon: <PiFolderUserDuotone />, label: 'Casos' },
      ],
      4:[
        { id: '/home_depto', icon: <FiHome />, label: 'Inicio' },
        { id: '/gestion', icon: <FiUsers />, label: 'Gestion Usuarios' },
        {
          id: 'sistema',
          icon: <FiSettings />,
          label: 'Sistema',
          subItems: [
            { id: '/ingresos', label: 'Ingresos' }
          ]
        },
        { id: '/casos', icon: <PiFolderUserDuotone />, label: 'Casos' },
      ],
      5:[
        { id: '/home_analista', icon: <FiHome />, label: 'Inicio' },
        { id: '/casos', icon: <PiFolderUserDuotone />, label: 'Casos' },
        { id: '/sabana', icon: <LuBookHeadphones />, label: 'Sabanas' },
      ]

}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

interface StaffProfile {
  name: string;
  role: string;
  birthdate: string;
  age: string;
  bloodType: string;
  phone: string;
  address: string;
}

@Component({
  selector: 'app-coordinador-visualizar-perfil-staff',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './coordinador-visualizar-perfil-staff.html',
  styleUrl: './coordinador-visualizar-perfil-staff.css'
})
export class CoordinadorVisualizarPerfilStaff implements OnInit {
  
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  // Base de datos ampliada con todos los miembros del staff para evitar fallos de coincidencia
  staffDatabase: { [key: string]: StaffProfile } = {
    'ROBERTO GÓMEZ': {
      name: 'ROBERTO GÓMEZ',
      role: 'DIRECTOR TÉCNICO',
      birthdate: '12/04/1981',
      age: '45 Años',
      bloodType: 'A +',
      phone: '3511234567',
      address: 'Calle Falsa 123'
    },
    'MARCOS AVALOS': {
      name: 'MARCOS AVALOS',
      role: 'PREPARADOR FÍSICO',
      birthdate: '25/09/1988',
      age: '38 Años',
      bloodType: 'O +',
      phone: '3519876543',
      address: 'Av. Colón 1200'
    },
    'ESTEBAN QUINTANA': {
      name: 'ESTEBAN QUINTANA',
      role: 'DIRECTOR TÉCNICO',
      birthdate: '03/01/1976',
      age: '50 Años',
      bloodType: 'B +',
      phone: '3514445566',
      address: 'Bv. San Juan 450'
    },
    'LUCAS MAIDANA': {
      name: 'LUCAS MAIDANA',
      role: 'PREPARADOR FÍSICO',
      birthdate: '14/06/1994',
      age: '32 Años',
      bloodType: 'AB +',
      phone: '3517778899',
      address: 'Chacabuco 890'
    },
    'DANIEL BUSTOS': {
      name: 'DANIEL BUSTOS',
      role: 'DIRECTOR TÉCNICO',
      birthdate: '19/11/1984',
      age: '42 Años',
      bloodType: 'O -',
      phone: '3512223344',
      address: 'Laprida 321'
    },
    'MATÍAS GIMÉNEZ': {
      name: 'MATÍAS GIMÉNEZ',
      role: 'PREPARADOR FÍSICO',
      birthdate: '30/03/1991',
      age: '35 Años',
      bloodType: 'A -',
      phone: '3516667788',
      address: 'Ituzaingó 1500'
    }
  };

  staffMember: StaffProfile = this.staffDatabase['ROBERTO GÓMEZ'];

  activeTab = 'Staff';
  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-seleccion-categorias' },
    { label: 'Staff', icon: 'badge', active: true, route: '/coordinador/visualizar-staff' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['staff']) {
        const staffName = decodeURIComponent(params['staff']).toUpperCase().trim();
        if (this.staffDatabase[staffName]) {
          this.staffMember = this.staffDatabase[staffName];
        } else {
          this.staffMember = {
            name: staffName,
            role: 'STAFF TÉCNICO CACC',
            birthdate: '01/01/1990',
            age: '36 Años',
            bloodType: 'O +',
            phone: '3510000000',
            address: 'Córdoba, Argentina'
          };
        }
      }
    });
  }

  selectNav(item: any) {
    this.navItems.forEach(n => n.active = (n.label === item.label));
    this.activeTab = item.label;
    if (item.route && item.route !== '#') {
      this.router.navigate([item.route]);
    }
  }

  logout() {
    localStorage.removeItem('cacc_jwt_token');
    this.router.navigate(['/login']);
  }

  editarPerfil() {
    console.log(`Editando perfil de staff: ${this.staffMember.name}`);
  }
}

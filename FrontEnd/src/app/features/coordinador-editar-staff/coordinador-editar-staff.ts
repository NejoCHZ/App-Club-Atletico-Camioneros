import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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
  selector: 'app-coordinador-editar-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-editar-staff.html',
  styleUrl: './coordinador-editar-staff.css'
})
export class CoordinadorEditarStaff implements OnInit {

  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  nombreCompleto = 'ROBERTO GÓMEZ';
  rol = 'DIRECTOR TÉCNICO';

  fechaNacimiento = '12/04/1981';
  edad = '45 Años';
  grupoSanguineo = 'A +';
  telefonoTutor = '3511234567';
  domicilio = 'Calle Falsa 123';

  activeTab = 'Staff';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: true, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
  ];

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['staff']) {
        const staffName = decodeURIComponent(params['staff']).toUpperCase().trim();
        if (this.staffDatabase[staffName]) {
          const s = this.staffDatabase[staffName];
          this.nombreCompleto = s.name;
          this.rol = s.role;
          this.fechaNacimiento = s.birthdate;
          this.edad = s.age;
          this.grupoSanguineo = s.bloodType;
          this.telefonoTutor = s.phone;
          this.domicilio = s.address;
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

  cancelar() {
    this.location.back();
  }

  guardar() {
    alert('Ficha de trabajador guardada con éxito.');
    this.location.back();
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

export interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  posicion: 'ARQUERO' | 'DEFENSOR' | 'VOLANTE' | 'DELANTERO';
  edad: string;
}

@Component({
  selector: 'app-admin-categoria-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-categoria-jugadores.html',
  styleUrl: './admin-categoria-jugadores.css',
})
export class AdminCategoriaJugadores implements OnInit {
  categoryId = 1;
  nombreCategoria = 'NOMBRE CATEGORIA';
  searchTerm = '';
  posicionFiltro = '';

  activeTab = 'Categorias';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: true }
  ];

  categoryPlayersMap: { [key: number]: { nombreCat: string; players: Player[] } } = {
    1: {
      nombreCat: 'CEBOLLITAS (2018 - 2019)',
      players: [
        { id: 101, nombreCompleto: 'LUIS OSCAR DIAZ', dni: '43.123.456', posicion: 'DELANTERO', edad: '05 AÑOS' },
        { id: 102, nombreCompleto: 'MATIAS ROMERO', dni: '43.123.456', posicion: 'VOLANTE', edad: '06 AÑOS' },
        { id: 103, nombreCompleto: 'JOAQUIN BENITEZ', dni: '43.123.456', posicion: 'ARQUERO', edad: '05 AÑOS' },
        { id: 104, nombreCompleto: 'THIAGO CASTRO', dni: '43.123.456', posicion: 'DEFENSOR', edad: '06 AÑOS' },
        { id: 105, nombreCompleto: 'FACUNDO CORIA', dni: '43.123.456', posicion: 'DELANTERO', edad: '05 AÑOS' },
        { id: 106, nombreCompleto: 'SANTIAGO SOSA', dni: '43.123.456', posicion: 'DEFENSOR', edad: '06 AÑOS' }
      ]
    },
    2: {
      nombreCat: 'PRE-INFANTIL (2016 - 2017)',
      players: [
        { id: 201, nombreCompleto: 'BENJAMIN GOMEZ', dni: '43.123.456', posicion: 'DELANTERO', edad: '07 AÑOS' },
        { id: 202, nombreCompleto: 'FRANCO ALVAREZ', dni: '43.123.456', posicion: 'VOLANTE', edad: '08 AÑOS' },
        { id: 203, nombreCompleto: 'SANTIAGO MEDINA', dni: '43.123.456', posicion: 'DEFENSOR', edad: '07 AÑOS' },
        { id: 204, nombreCompleto: 'NICOLAS CORIA', dni: '43.123.456', posicion: 'ARQUERO', edad: '08 AÑOS' },
        { id: 205, nombreCompleto: 'MAXIMILIANO RUIZ', dni: '43.123.456', posicion: 'VOLANTE', edad: '07 AÑOS' },
        { id: 206, nombreCompleto: 'VALENTIN TORRES', dni: '43.123.456', posicion: 'DELANTERO', edad: '08 AÑOS' }
      ]
    },
    3: {
      nombreCat: 'INFANTIL (2014 - 2015)',
      players: [
        { id: 301, nombreCompleto: 'CARLOS GUTIERREZ', dni: '43.123.456', posicion: 'ARQUERO', edad: '09 AÑOS' },
        { id: 302, nombreCompleto: 'VALENTIN MORENO', dni: '43.123.456', posicion: 'DEFENSOR', edad: '10 AÑOS' },
        { id: 303, nombreCompleto: 'LUCAS SILVA', dni: '43.123.456', posicion: 'VOLANTE', edad: '09 AÑOS' },
        { id: 304, nombreCompleto: 'EMILIANO VAZQUEZ', dni: '43.123.456', posicion: 'DELANTERO', edad: '10 AÑOS' },
        { id: 305, nombreCompleto: 'FEDERICO ACOSTA', dni: '43.123.456', posicion: 'DEFENSOR', edad: '09 AÑOS' },
        { id: 306, nombreCompleto: 'GONZALO IBAÑEZ', dni: '43.123.456', posicion: 'VOLANTE', edad: '10 AÑOS' }
      ]
    },
    4: {
      nombreCat: 'JUVENIL (2011 - 2013)',
      players: [
        { id: 401, nombreCompleto: 'MATEO BENITEZ', dni: '43.123.456', posicion: 'DELANTERO', edad: '11 AÑOS' },
        { id: 402, nombreCompleto: 'LAUTARO MARTINEZ', dni: '43.123.456', posicion: 'DEFENSOR', edad: '13 AÑOS' },
        { id: 403, nombreCompleto: 'AGUSTIN PERALTA', dni: '43.123.456', posicion: 'VOLANTE', edad: '12 AÑOS' },
        { id: 404, nombreCompleto: 'IGNACIO SUSAETA', dni: '43.123.456', posicion: 'ARQUERO', edad: '13 AÑOS' },
        { id: 405, nombreCompleto: 'MANUEL CABRAL', dni: '43.123.456', posicion: 'DEFENSOR', edad: '11 AÑOS' },
        { id: 406, nombreCompleto: 'SEBASTIAN LUNA', dni: '43.123.456', posicion: 'DELANTERO', edad: '12 AÑOS' }
      ]
    }
  };

  players: Player[] = [
    { id: 1, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'DELANTERO', edad: '00 AÑOS' },
    { id: 2, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'VOLANTE', edad: '00 AÑOS' },
    { id: 3, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'DEFENSOR', edad: '00 AÑOS' },
    { id: 4, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'ARQUERO', edad: '00 AÑOS' },
    { id: 5, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'DELANTERO', edad: '00 AÑOS' },
    { id: 6, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'DEFENSOR', edad: '00 AÑOS' }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.categoryId = Number(idParam);
        const catData = this.categoryPlayersMap[this.categoryId];
        if (catData) {
          this.nombreCategoria = catData.nombreCat;
          this.players = catData.players;
        }
      }
    });
  }

  togglePosicion(pos: string) {
    if (this.posicionFiltro === pos) {
      this.posicionFiltro = '';
    } else {
      this.posicionFiltro = pos;
    }
  }

  get filteredPlayers(): Player[] {
    return this.players.filter(p => {
      const term = this.searchTerm.trim().toLowerCase();
      const matchSearch = !term || p.nombreCompleto.toLowerCase().includes(term) || p.dni.includes(term);
      const matchPos = !this.posicionFiltro || p.posicion === this.posicionFiltro;
      return matchSearch && matchPos;
    });
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
    if (label === 'Inicio') {
      this.router.navigate(['/admin']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/admin/lista-jugadores']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/admin/categorias']);
    } else if (label === 'Staff') {
      this.router.navigate(['/admin/staff']);
    }
  }

  verFicha(id: number) {
    this.router.navigate(['/admin/ficha-jugador', id]);
  }

  editarJugador(id: number) {
    this.router.navigate(['/admin/editar-perfil', id]);
  }
}

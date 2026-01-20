import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

@Component({
  selector: 'app-nexo',
  standalone: true,
  imports: [CommonModule, FormsModule], // 👈 AQUÍ VA FormsModule
  templateUrl: './nexo.component.html',
  styleUrls: ['./nexo.component.css']
})
export class NexoComponent {

  messages: Message[] = [
    { from: 'bot', text: 'Hola 👋 Soy NEXO, ¿qué quieres preguntarme?' }
  ];

  userInput = '';

  sendMessage() {
    if (!this.userInput.trim()) return;

    this.messages.push({
      from: 'user',
      text: this.userInput
    });

    setTimeout(() => {
      this.messages.push({
        from: 'bot',
        text: '🤖 Pronto estaré conectado a una IA real...'
      });
    }, 600);

    this.userInput = '';
  }
}
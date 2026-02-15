import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatbotMessage } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  messages: ChatbotMessage[] = [];
  newMessage: string = '';
  isChatOpen: boolean = false;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  private shouldScroll = false;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit() {
    this.addBotMessage('Hello! I\'m your TechTreck assistant. How can I help you today?');
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  async sendMessage() {
    if (this.newMessage.trim()) {
      const userMessage = this.newMessage;
      this.newMessage = ''; // Clear input immediately
      
      // Add user message
      this.addUserMessage(userMessage);
      
      // Show typing indicator
      this.addBotMessage('...');
      
      try {
        // Get bot response
        const response = await this.chatbotService.findAnswer(userMessage);
        
        // Replace typing indicator with actual response
        this.messages[this.messages.length - 1].text = response;
        this.shouldScroll = true;
      } catch (error) {
        // Replace typing indicator with error message
        this.messages[this.messages.length - 1].text = "Sorry, I encountered an error. Please try again.";
        this.shouldScroll = true;
      }
    }
  }

  private addUserMessage(text: string) {
    this.messages.push({
      text,
      type: 'user'
    });
    this.shouldScroll = true;
  }

  private addBotMessage(text: string) {
    this.messages.push({
      text,
      type: 'bot'
    });
    this.shouldScroll = true;
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}

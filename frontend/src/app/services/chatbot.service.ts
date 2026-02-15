import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface ChatbotMessage {
  text: string;
  type: 'user' | 'bot';
}

export interface QAPair {
  question: string;
  answer: string;
  keywords: string[];
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  private apiCache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  private qaDatabase: QAPair[] = [
    {
      question: "How do I log my time?",
      answer: "To log your time, go to the Time Tracking section and click the 'Add Time Entry' button. Fill in the date, hours, and description of your work.",
      keywords: ['log', 'time', 'entry', 'track']
    },
    {
      question: "How do I request PTO?",
      answer: "Navigate to the PTO section, click 'Request PTO', select your dates, and submit the request.",
      keywords: ['pto', 'vacation', 'leave', 'request']
    },
    {
      question: "How do I filter my time logs?",
      answer: "Use the filter section at the top of the Time Tracking page. You can filter by date range, ascending or descending order.",
      keywords: ['filter', 'search', 'find', 'logs']
    },
    {
      question: "What is the TimeTracker App?",
      answer: "The TimeTracker App is a time tracking and PTO management application that helps you log your work hours and manage your time off requests efficiently.",
      keywords: ['techtreck', 'about', 'what']
    }
  ];

  async findAnswer(userInput: string): Promise<string> {
    const cacheKey = userInput.toLowerCase().trim();
    
    // Check cache first
    if (this.apiCache.has(cacheKey)) {
      return this.apiCache.get(cacheKey)!;
    }

    const normalizedInput = userInput.toLowerCase();
    
    // Handle common greetings and casual conversation first
    const greetingPatterns = [
      /\b(hi|hello|hey|bonjour|salut|hola|ciao|greetings?|good\s+(morning|afternoon|evening))\b/i,
      /\b(what'?s?\s+up|how'?s?\s+it\s+going|sup)\b/i
    ];
    
    const isGreeting = greetingPatterns.some(pattern => pattern.test(userInput)) && 
                      (userInput.length < 30 && !userInput.includes('?') && !userInput.includes('how') && !userInput.includes('what') && !userInput.includes('who') && !userInput.includes('where') && !userInput.includes('when') && !userInput.includes('why'));
    
    if (isGreeting) {
      return "Hello! How can I help you with time tracking or PTO management today?";
    }
    
    const thanksPatterns = [
      /\b(thanks?|thank\s+you|thx|ty|appreciate|gracias|merci)\b/i
    ];
    
    const isThanks = thanksPatterns.some(pattern => pattern.test(userInput));
    
    if (isThanks) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    const byePatterns = [
      /\b(bye|goodbye|see\s+you|later|farewell|adios|au\s+revoir)\b/i
    ];
    
    const isGoodbye = byePatterns.some(pattern => pattern.test(userInput));
    
    if (isGoodbye) {
      return "Goodbye! Have a great day!";
    }
    
    // Handle status questions
    if (/\b(how\s+are\s+you|how\s+do\s+you\s+do|how'?s?\s+it\s+going)\b/i.test(userInput)) {
      return "I'm doing well, thank you! I'm here to help you with time tracking and PTO management.";
    }
    
    // Handle help/capability questions
    if (/\b(what\s+can\s+you\s+do|help|capabilities?|features?)\b/i.test(userInput)) {
      return "I can help you with time tracking, PTO requests, filtering logs, and answer general knowledge questions!";
    }
    
    // First try exact question match
    const exactMatch = this.qaDatabase.find(qa => 
      qa.question.toLowerCase() === normalizedInput
    );
    if (exactMatch) return exactMatch.answer;

    // For app-specific questions, match keywords more precisely
    const filterMatch = normalizedInput.includes('filter') && normalizedInput.includes('log');
    if (filterMatch) {
      return this.qaDatabase.find(qa => qa.question.toLowerCase().includes('filter'))?.answer || '';
    }

    const ptoMatch = normalizedInput.includes('pto') || normalizedInput.includes('vacation');
    if (ptoMatch) {
      return this.qaDatabase.find(qa => qa.question.toLowerCase().includes('pto'))?.answer || '';
    }

    const timeMatch = normalizedInput.includes('log') && normalizedInput.includes('time');
    if (timeMatch) {
      return this.qaDatabase.find(qa => qa.question.toLowerCase().includes('log my time'))?.answer || '';
    }

    const aboutMatch = normalizedInput.includes('what') && (normalizedInput.includes('app') || normalizedInput.includes('timetracker'));
    if (aboutMatch) {
      return this.qaDatabase.find(qa => qa.question.toLowerCase().includes('what is'))?.answer || '';
    }

    // For non-app questions, use a free AI service
    try {
      // Try multiple free APIs for better results
      const apis = [
        // DuckDuckGo Instant Answer with multiple search strategies
        async () => {
          const searchStrategies = [
            userInput, // Original question
            userInput.replace(/\bwhat is\b/i, '').trim(), // Remove "what is" for direct search
            userInput + ' definition', // Add "definition" for better results
            userInput + ' wikipedia' // Add wikipedia for more comprehensive results
          ];
          
          for (const query of searchStrategies) {
            try {
              const response = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1&t=techtreck_chatbot');
              const data = await response.json();
              
              console.log(`DuckDuckGo response for "${query}":`, data);
              
              // Try different response fields
              if (data.Answer && data.Answer.length > 5) {
                this.apiCache.set(cacheKey, data.Answer);
                return data.Answer;
              }
              if (data.AbstractText && data.AbstractText.length > 15) {
                this.apiCache.set(cacheKey, data.AbstractText);
                return data.AbstractText;
              }
              if (data.Definition && data.Definition.length > 10) {
                this.apiCache.set(cacheKey, data.Definition);
                return data.Definition;
              }
              
              // Try related topics with better filtering
              if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                const usefulTopics = data.RelatedTopics.filter((t: any) => 
                  t.Text && 
                  t.Text.length > 25 && 
                  !t.Text.includes('http') && 
                  !t.Text.includes('wikipedia.org') &&
                  !t.Text.includes('See also') &&
                  !t.Text.includes('External links')
                );
                
                if (usefulTopics.length > 0) {
                  this.apiCache.set(cacheKey, usefulTopics[0].Text);
                  return usefulTopics[0].Text;
                }
              }
              
              // Try results
              if (data.Results && data.Results.length > 0) {
                const usefulResult = data.Results.find((r: any) => 
                  r.Text && r.Text.length > 20 && !r.Text.includes('http')
                );
                if (usefulResult) {
                  this.apiCache.set(cacheKey, usefulResult.Text);
                  return usefulResult.Text;
                }
              }
              
            } catch (e) {
              console.log(`Search strategy "${query}" failed:`, e);
              continue;
            }
          }
          
          return null;
        },
        
        // Wikipedia API as fallback
        async () => {
          const searchTerms = [
            userInput, // Original
            userInput.replace(/\bwhat is\b/i, '').trim(), // Remove "what is"
            userInput.replace(/\bwhat is an?\b/i, '').trim(), // Remove "what is a/an"
            userInput.replace(/\bwhat are\b/i, '').trim(), // Remove "what are"
          ];
          
          for (const term of searchTerms) {
            try {
              const cleanTerm = term.replace(/\s+/g, '_').replace(/[^\w_]/g, '');
              const wikiResponse = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(cleanTerm));
              
              if (wikiResponse.ok) {
                const wikiData = await wikiResponse.json();
                console.log(`Wikipedia response for "${term}":`, wikiData);
                
                if (wikiData.extract && wikiData.extract.length > 20) {
                  // Clean up the extract and limit length
                  let cleanExtract = wikiData.extract.replace(/\s+/g, ' ').trim();
                  
                  // For definition-type questions, try to get the first sentence or two
                  if (userInput.toLowerCase().includes('what is') || userInput.toLowerCase().includes('what are')) {
                    const sentences = cleanExtract.split(/[.!?]+/);
                    const firstTwoSentences = sentences.slice(0, 2).join('. ').trim();
                    if (firstTwoSentences.length > 10) {
                      this.apiCache.set(cacheKey, firstTwoSentences + (firstTwoSentences.endsWith('.') ? '' : '.'));
                      return firstTwoSentences + (firstTwoSentences.endsWith('.') ? '' : '.');
                    }
                  }
                  
                  const finalAnswer = cleanExtract.substring(0, 250) + (cleanExtract.length > 250 ? '...' : '');
                  this.apiCache.set(cacheKey, finalAnswer);
                  return finalAnswer;
                }
              }
            } catch (e) {
              console.log(`Wikipedia search for "${term}" failed:`, e);
              continue;
            }
          }
          
          // Fallback: Use Wikipedia search API to find the best matching page
          try {
            const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(userInput)}&format=json&origin=*`);
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
                const bestMatch = searchData.query.search[0];
                const pageResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestMatch.title)}`);
                if (pageResponse.ok) {
                  const pageData = await pageResponse.json();
                  if (pageData.extract && pageData.extract.length > 20) {
                    let cleanExtract = pageData.extract.replace(/\s+/g, ' ').trim();
                    const finalAnswer = cleanExtract.substring(0, 250) + (cleanExtract.length > 250 ? '...' : '');
                    this.apiCache.set(cacheKey, finalAnswer);
                    return finalAnswer;
                  }
                }
              }
            }
          } catch (e) {
            console.log('Wikipedia search API fallback failed:', e);
          }
          
          return null;
        },

        // Additional search API for better coverage
        async () => {
          try {
            // Try a different search approach for common/popular questions
            if (userInput.toLowerCase().includes('most common') || userInput.toLowerCase().includes('popular')) {
              const altQuery = userInput.replace(/most common/i, 'top').replace(/popular/i, 'most popular');
              const altResponse = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(altQuery) + '&format=json&no_html=1&t=techtreck_chatbot');
              const altData = await altResponse.json();
              
              if (altData.Answer) {
                this.apiCache.set(cacheKey, altData.Answer);
                return altData.Answer;
              }
              if (altData.AbstractText && altData.AbstractText.length > 10) {
                this.apiCache.set(cacheKey, altData.AbstractText);
                return altData.AbstractText;
              }
            }
            
            // For capital questions, try a more direct approach
            if (userInput.toLowerCase().includes('capital') && userInput.toLowerCase().includes('what')) {
              const capitalMatch = userInput.match(/capital of ([a-zA-Z\s]+)/i);
              if (capitalMatch) {
                const country = capitalMatch[1].trim();
                const capitalResponse = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(`capital of ${country}`) + '&format=json&no_html=1&t=techtreck_chatbot');
                const capitalData = await capitalResponse.json();
                
                if (capitalData.Answer) {
                  this.apiCache.set(cacheKey, capitalData.Answer);
                  return capitalData.Answer;
                }
                if (capitalData.AbstractText) {
                  this.apiCache.set(cacheKey, capitalData.AbstractText);
                  return capitalData.AbstractText;
                }
              }
            }
            
            return null;
          } catch (e) {
            console.log('Alternative search failed:', e);
            return null;
          }
        }
      ];
      
      // Try each API until we get a result
      for (const apiCall of apis) {
        try {
          const result = await apiCall();
          if (result) {
            return result;
          }
        } catch (e) {
          console.log('API call failed:', e);
          continue;
        }
      }
      
      // If all APIs fail, provide a helpful fallback
      return "I couldn't find a clear answer to that question. For general questions, try asking about time tracking or PTO management instead.";
    } catch (error) {
      console.error('Free AI API Error:', error);
      return "I'm temporarily unable to answer general questions, but I can still help you with time tracking and PTO management!";
    }
  }

  // Method to clear cache if needed
  clearCache(): void {
    this.apiCache.clear();
  }

  // Method to get cache size for monitoring
  getCacheSize(): number {
    return this.apiCache.size;
  }
}


import { TestMethod } from './MavenTestScanner';

export interface ParsedCommand {
  sequence: string[];
  confidence: number;
  reasoning: string;
}

export class NaturalLanguageProcessor {
  private testMethods: TestMethod[];

  constructor(testMethods: TestMethod[]) {
    this.testMethods = testMethods;
  }

  parseComplexCommand(input: string): ParsedCommand {
    const lowercaseInput = input.toLowerCase();
    const sequence: string[] = [];
    let reasoning = '';

    // Enhanced parsing for complex sequences
    const steps = this.extractSteps(lowercaseInput);
    
    for (const step of steps) {
      const matchedMethod = this.findBestMatch(step);
      if (matchedMethod) {
        sequence.push(`${matchedMethod.className}#${matchedMethod.methodName}`);
      }
    }

    // Build reasoning
    if (sequence.length > 0) {
      reasoning = `Identified ${sequence.length} test steps: ${steps.join(' → ')}`;
    } else {
      reasoning = `Could not identify test methods from: "${input}"`;
    }

    return {
      sequence,
      confidence: sequence.length > 0 ? 0.85 : 0.2,
      reasoning
    };
  }

  private extractSteps(input: string): string[] {
    // Split by common conjunctions and sequence indicators
    const conjunctions = [
      'and then', 'then', 'after that', 'next', 'followed by',
      'and', ',', 'also', 'subsequently', 'afterwards'
    ];
    
    let steps = [input];
    
    for (const conjunction of conjunctions) {
      const newSteps: string[] = [];
      for (const step of steps) {
        newSteps.push(...step.split(conjunction).map(s => s.trim()));
      }
      steps = newSteps.filter(s => s.length > 0);
    }

    return steps;
  }

  private findBestMatch(step: string): TestMethod | null {
    let bestMatch: TestMethod | null = null;
    let bestScore = 0;

    for (const method of this.testMethods) {
      const score = this.calculateMatchScore(step, method);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = method;
      }
    }

    return bestScore > 0.3 ? bestMatch : null;
  }

  private calculateMatchScore(step: string, method: TestMethod): number {
    const stepWords = step.toLowerCase().split(/\s+/);
    let score = 0;
    let totalWords = stepWords.length;

    // Check keywords
    for (const keyword of method.keywords) {
      for (const word of stepWords) {
        if (keyword.includes(word) || word.includes(keyword)) {
          score += 0.8;
        }
      }
    }

    // Check method name
    const methodWords = method.methodName.toLowerCase().split(/(?=[A-Z])/);
    for (const methodWord of methodWords) {
      for (const word of stepWords) {
        if (methodWord.includes(word) || word.includes(methodWord)) {
          score += 0.6;
        }
      }
    }

    // Check description
    const descWords = method.description.toLowerCase().split(/\s+/);
    for (const descWord of descWords) {
      for (const word of stepWords) {
        if (descWord.includes(word) || word.includes(descWord)) {
          score += 0.4;
        }
      }
    }

    return totalWords > 0 ? score / totalWords : 0;
  }
}

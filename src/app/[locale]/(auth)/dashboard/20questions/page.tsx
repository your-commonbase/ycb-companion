/* eslint-disable no-useless-escape */

'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';

import QuickLook from '@/components/Thread/QuickLook';
import type { FlattenedEntry } from '@/components/Thread/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Question {
  id: string;
  text: string;
  searchResults: any[];
  resources: string[];
  isLoadingSearch: boolean;
  isLoadingResources: boolean;
}

export default function TwentyQuestionsPage() {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quickLookEntry, setQuickLookEntry] = useState<FlattenedEntry | null>(
    null,
  );
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);

  // Track current operation type and target
  const [currentOperation, setCurrentOperation] = useState<{
    type: 'questions' | 'resources';
    questionId?: string;
  } | null>(null);

  const searchQuestionAutomatically = async (
    questionId: string,
    questionText: string,
  ) => {
    console.log(`Searching question ${questionId}:`, questionText);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: questionText }),
      });

      console.log(`Search response for ${questionId}:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`Search data for ${questionId}:`, data);

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  searchResults: data.data || [],
                  isLoadingSearch: false,
                }
              : q,
          ),
        );

        // Load images for image entries if any
        const imageEntries = (data.data || []).filter(
          (entry: any) => entry.metadata?.type === 'image',
        );
        if (imageEntries.length > 0) {
          const imageIds = imageEntries.map((entry: any) => entry.id);
          await fetch('/api/fetchImageByIDs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: imageIds }),
          });
          // Handle image URLs if needed
        }
      } else {
        console.error(`Search failed for ${questionId}:`, response.status);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, isLoadingSearch: false } : q,
          ),
        );
      }
    } catch (error) {
      console.error(`Error searching question ${questionId}:`, error);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, isLoadingSearch: false } : q,
        ),
      );
    }
  };

  // Single AI Chat hook for all operations
  const { append, isLoading, messages, setMessages } = useChat({
    onFinish: async (message) => {
      console.log('onFinish called with:', { message, currentOperation });
      console.log('Message content length:', message.content.length);
      console.log('Current operation at finish:', currentOperation);

      if (!currentOperation) {
        console.warn('onFinish called but currentOperation is null');
        return;
      }

      try {
        if (currentOperation.type === 'questions') {
          // Parse the response to extract questions
          console.log('Raw message content:', message.content);

          const lines = message.content
            .split('\n')
            .filter((line) => line.trim())
            .filter((line) => /^\d+\./.test(line.trim()));

          console.log('Filtered lines:', lines);

          const newQuestions: Question[] = lines.map((line, index) => ({
            id: `q-${index}`,
            text: line.replace(/^\d+\.\s*/, '').trim(),
            searchResults: [],
            resources: [],
            isLoadingSearch: true, // Start with loading state
            isLoadingResources: false,
          }));

          console.log('Parsed questions:', newQuestions);

          if (newQuestions.length > 0) {
            setQuestions(newQuestions);
            setIsGenerating(false);

            // Automatically search for all questions
            console.log('Starting automatic searches...');
            await Promise.all(
              newQuestions.map((question) =>
                searchQuestionAutomatically(question.id, question.text),
              ),
            );
            console.log('All searches completed');
          } else {
            console.warn('No questions parsed from response');
            setIsGenerating(false);
          }
        } else if (
          currentOperation.type === 'resources' &&
          currentOperation.questionId
        ) {
          // Parse the AI response to extract resources
          const { content } = message;
          const lines = content.split('\n').filter((line) => line.trim());

          // Extract lines that look like resources
          const resources = lines
            .filter(
              (line) =>
                line.match(/^[\-\*\•]\s+/) || // Bullet points
                line.match(/^\d+\.\s+/) || // Numbered lists
                line.includes('http') || // URLs
                line.length > 10, // Substantial content
            )
            .map((line) => line.replace(/^[\-\*\•\d\.\s]+/, '').trim()) // Clean up formatting
            .filter((line) => line.length > 5) // Remove very short items
            .slice(0, 10); // Limit to 10 resources

          // If no structured resources found, split by sentences and take meaningful ones
          if (resources.length === 0) {
            const sentences = content
              .split(/[.!?]+/)
              .filter((s) => s.trim().length > 20);
            resources.push(...sentences.slice(0, 5).map((s) => s.trim()));
          }

          setQuestions((prev) =>
            prev.map((q) =>
              q.id === currentOperation.questionId
                ? {
                    ...q,
                    resources:
                      resources.length > 0
                        ? resources
                        : ['No specific resources found in response'],
                    isLoadingResources: false,
                  }
                : q,
            ),
          );
        }
      } catch (error) {
        // Error handling
        if (currentOperation.type === 'questions') {
          setIsGenerating(false);
        } else if (
          currentOperation.type === 'resources' &&
          currentOperation.questionId
        ) {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === currentOperation.questionId
                ? {
                    ...q,
                    resources: ['Error generating resources'],
                    isLoadingResources: false,
                  }
                : q,
            ),
          );
        }
      }

      setCurrentOperation(null);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      console.log('Current operation at error:', currentOperation);
      setIsGenerating(false);
      setCurrentOperation(null);
    },
  });

  // Fallback mechanism: If streaming stops but onFinish wasn't called
  const lastProcessedMessageId = useRef<string>('');

  useEffect(() => {
    // Check if streaming has stopped and we have a new message that hasn't been processed
    if (!isLoading && messages.length > 0 && currentOperation) {
      const lastMessage = messages[messages.length - 1];

      // Only process assistant messages
      if (
        lastMessage!.role === 'assistant' &&
        lastMessage!.id !== lastProcessedMessageId.current
      ) {
        console.log('Fallback: Processing message that onFinish missed');
        console.log('Message:', lastMessage);
        console.log('Current operation:', currentOperation);

        lastProcessedMessageId.current = lastMessage!.id;

        // Manually trigger the same logic as onFinish
        if (currentOperation.type === 'questions') {
          console.log('Fallback: Processing questions');
          const lines = lastMessage!.content
            .split('\n')
            .filter((line) => line.trim())
            .filter((line) => /^\d+\./.test(line.trim()));

          const newQuestions: Question[] = lines.map((line, index) => ({
            id: `q-${index}`,
            text: line.replace(/^\d+\.\s*/, '').trim(),
            searchResults: [],
            resources: [],
            isLoadingSearch: true,
            isLoadingResources: false,
          }));

          if (newQuestions.length > 0) {
            setQuestions(newQuestions);
            setIsGenerating(false);

            // Automatically search for all questions
            Promise.all(
              newQuestions.map((question) =>
                searchQuestionAutomatically(question.id, question.text),
              ),
            );
          } else {
            setIsGenerating(false);
          }
        } else if (
          currentOperation.type === 'resources' &&
          currentOperation.questionId
        ) {
          console.log('Fallback: Processing resources');
          const { content } = lastMessage!;
          const lines = content.split('\n').filter((line) => line.trim());

          const resources = lines
            .filter(
              (line) =>
                line.match(/^[\-\*\•]\s+/) ||
                line.match(/^\d+\.\s+/) ||
                line.includes('http') ||
                line.length > 10,
            )
            .map((line) => line.replace(/^[\-\*\•\d\.\s]+/, '').trim())
            .filter((line) => line.length > 5)
            .slice(0, 10);

          if (resources.length === 0) {
            const sentences = content
              .split(/[.!?]+/)
              .filter((s) => s.trim().length > 20);
            resources.push(...sentences.slice(0, 5).map((s) => s.trim()));
          }

          setQuestions((prev) =>
            prev.map((q) =>
              q.id === currentOperation.questionId
                ? {
                    ...q,
                    resources:
                      resources.length > 0
                        ? resources
                        : ['No specific resources found in response'],
                    isLoadingResources: false,
                  }
                : q,
            ),
          );
        }

        setCurrentOperation(null);
      }
    }
  }, [isLoading, messages, currentOperation]);

  const handleGenerateQuestions = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setQuestions([]);
    setMessages([]); // Clear previous messages

    const operation = { type: 'questions' as const };
    console.log('Setting currentOperation for questions:', operation);
    setCurrentOperation(operation);

    try {
      console.log('Calling append for questions...');
      await append({
        role: 'user',
        content: `Generate 20 distinct questions about this topic: ${topic.trim()}. Format each question as a numbered list (1. Question text, 2. Question text, etc.)`,
      });
      console.log('Append call completed for questions');
    } catch (error) {
      // Error generating questions
      console.error('Error in handleGenerateQuestions:', error);
      setIsGenerating(false);
      setCurrentOperation(null);
    }
  };

  const handleGenerateResources = async (
    questionId: string,
    questionText: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, isLoadingResources: true } : q,
      ),
    );

    const operation = { type: 'resources' as const, questionId };
    console.log('Setting currentOperation for resources:', operation);
    setCurrentOperation(operation);

    try {
      console.log('Calling append for resources...');
      await append({
        role: 'user',
        content: `Generate useful resources and references for learning about this question: "${questionText}". Please provide specific books, articles, websites, courses, tools, or other educational materials. Format your response as a list with clear titles and brief descriptions.`,
      });
      console.log('Append call completed for resources');
    } catch (error) {
      // Error generating resources
      console.error('Error in handleGenerateResources:', error);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, isLoadingResources: false } : q,
        ),
      );
      setCurrentOperation(null);
    }
  };

  const handleQuickLook = (entry: any) => {
    // Convert search result to FlattenedEntry format
    const flattenedEntry: FlattenedEntry = {
      id: entry.id,
      data: entry.data,
      comments: [],
      createdAt: entry.createdAt || new Date().toISOString(),
      metadata: entry.metadata || {},
      relationshipType: 'root',
      level: 0,
    };

    setQuickLookEntry(flattenedEntry);
    setIsQuickLookOpen(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>20 Questions</CardTitle>
          <CardDescription>
            Generate 20 questions about any topic and explore your knowledge
            base for answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-sm font-medium text-gray-700">
                I want to learn about
              </label>
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (topic.trim() && !isGenerating && !isLoading) {
                      handleGenerateQuestions();
                    }
                  }
                }}
                placeholder="Enter a topic you'd like to explore..."
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating || isLoading}
              />
            </div>
            <button
              onClick={handleGenerateQuestions}
              disabled={!topic.trim() || isGenerating || isLoading}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {isGenerating ||
              (isLoading && currentOperation?.type === 'questions')
                ? 'Generating Questions...'
                : 'Generate 20 Questions'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      {(questions.length > 0 ||
        (isLoading && currentOperation?.type === 'questions')) && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Questions about: {topic}
          </h2>

          {/* Show streaming progress for question generation */}
          {isLoading &&
            currentOperation?.type === 'questions' &&
            messages.length > 0 && (
              <Card className="border border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span className="text-sm font-medium text-blue-700">
                      Generating questions...
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-blue-600">
                    {messages[messages.length - 1]?.content || ''}
                  </div>
                </CardContent>
              </Card>
            )}

          {questions.map((question) => (
            <Card key={question.id} className="border border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {questions.indexOf(question) + 1}. {question.text}
                  </CardTitle>
                  <div className="flex gap-2">
                    {question.isLoadingSearch && (
                      <span className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        Searching knowledge base...
                      </span>
                    )}
                    <button
                      onClick={() =>
                        handleGenerateResources(question.id, question.text)
                      }
                      disabled={
                        question.isLoadingResources ||
                        (isLoading &&
                          currentOperation?.type === 'resources' &&
                          currentOperation?.questionId === question.id)
                      }
                      className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                      type="button"
                    >
                      {question.isLoadingResources ||
                      (isLoading &&
                        currentOperation?.type === 'resources' &&
                        currentOperation?.questionId === question.id)
                        ? 'Generating...'
                        : 'Generate Resources'}
                    </button>
                  </div>
                </div>
              </CardHeader>

              {/* Search Results */}
              {question.searchResults.length > 0 && (
                <CardContent>
                  <h4 className="mb-3 font-medium text-gray-700">
                    Your Commonbase Results:
                  </h4>
                  <div className="space-y-2">
                    {question.searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-start justify-between rounded-lg border border-gray-100 p-3"
                      >
                        <div className="flex-1">
                          <p className="line-clamp-2 text-sm text-gray-900">
                            {result.data}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleQuickLook(result)}
                          className="ml-3 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                          type="button"
                        >
                          Quick Look
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {/* Streaming Resources */}
              {isLoading &&
                currentOperation?.type === 'resources' &&
                currentOperation?.questionId === question.id &&
                messages.length > 0 && (
                  <CardContent>
                    <h4 className="mb-3 font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="size-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                        Generating Resources...
                      </div>
                    </h4>
                    <div className="whitespace-pre-wrap text-sm text-gray-600">
                      {messages[messages.length - 1]?.content || ''}
                    </div>
                  </CardContent>
                )}

              {/* Resources */}
              {question.resources.length > 0 && (
                <CardContent>
                  <h4 className="mb-3 font-medium text-gray-700">
                    Recommended Resources:
                  </h4>
                  <ul className="space-y-1">
                    {question.resources.map((resource) => (
                      <li key={resource} className="text-sm text-gray-600">
                        • {resource}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* QuickLook Modal */}
      {isQuickLookOpen && quickLookEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[95vh] w-full max-w-[95vw] flex-col rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">QuickLook</h2>
              <button
                onClick={() => {
                  setIsQuickLookOpen(false);
                  setQuickLookEntry(null);
                }}
                className="text-gray-400 transition-colors hover:text-gray-600"
                type="button"
                aria-label="Close"
              >
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-6"
              style={{ minHeight: 0 }}
            >
              <QuickLook
                currentEntry={quickLookEntry}
                allEntries={[quickLookEntry]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

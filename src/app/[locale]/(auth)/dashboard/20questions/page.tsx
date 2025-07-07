/* eslint-disable no-useless-escape */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */

'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import QuickLook from '@/components/Thread/QuickLook';
import type { FlattenedEntry } from '@/components/Thread/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface WebResult {
  title: string;
  url: string;
  description: string;
  isAdded?: boolean;
  isAdding?: boolean;
}

interface SearchResult {
  id: string;
  data: string;
  highlightedData?: string; // AI-highlighted version with <strong> tags
  createdAt: string;
  metadata: any;
  similarity?: number;
  tempImageUrl?: string;
}

interface Question {
  id: string;
  text: string;
  searchResults: SearchResult[];
  resources: string[];
  webResults: WebResult[];
  isLoadingSearch: boolean;
  isLoadingResources: boolean;
  isLoadingWebResults: boolean;
  isAnalyzingRelevance: boolean;
}

// Custom components for ReactMarkdown - defined outside render to avoid re-creation
const CustomPre = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) => (
  <pre className="overflow-x-auto whitespace-pre-wrap break-words" {...props}>
    {children}
  </pre>
);

const CustomCode = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <code className="break-words" {...props}>
    {children}
  </code>
);

export default function TwentyQuestionsPage() {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [quickLookEntry, setQuickLookEntry] = useState<FlattenedEntry | null>(
    null,
  );
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [, setSeenIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [currentCommentEntry, setCurrentCommentEntry] =
    useState<SearchResult | null>(null);
  const [commentText, setCommentText] = useState('');

  // Track current operation type and target
  const [currentOperation, setCurrentOperation] = useState<{
    type: 'questions';
  } | null>(null);

  const analyzeSearchResultRelevance = async (
    questionId: string,
    questionText: string,
    searchResults: SearchResult[],
  ) => {
    if (searchResults.length === 0) return;

    // Set analyzing state
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, isAnalyzingRelevance: true } : q,
      ),
    );

    try {
      console.log('🔍 Starting relevance analysis for question:', questionText);
      console.log('📊 Search results to analyze:', searchResults.length);

      // Prepare the prompt with question and search results
      const resultsForAnalysis = searchResults.map((result, index) => ({
        index,
        id: result.id,
        content: result.data,
      }));

      console.log('📝 Prepared results for analysis:', resultsForAnalysis);

      const prompt = `Given this question and search results, for each search result, identify the most relevant substring that answers or relates to the question. Return a JSON array with the format:
[
  {
    "index": 0,
    "relevantSubstring": "the exact text from the content that is most relevant",
    "highlightedContent": "the full content with <strong> tags around the relevant substring"
  },
  ...
]

Question: "${questionText}"

Search Results:
${resultsForAnalysis.map((result) => `${result.index}. ${result.content}`).join('\n\n')}

Return ONLY the JSON array, no other text.`;

      console.log('🚀 Sending AI analysis request...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      console.log('📡 AI response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Full AI response data:', data);

        const aiResponse =
          data.messages?.[data.messages.length - 1]?.content || '';
        console.log('🤖 AI response content:', aiResponse);
        console.log('🤖 AI response length:', aiResponse.length);

        // Handle streaming response or markdown-wrapped JSON
        let jsonContent = aiResponse;

        // If response is wrapped in markdown code blocks, extract the JSON
        const codeBlockMatch = aiResponse.match(
          /```(?:json)?\s*([\s\S]*?)\s*```/,
        );
        if (codeBlockMatch) {
          jsonContent = codeBlockMatch[1].trim();
          console.log('📄 Extracted JSON from code block:', jsonContent);
        }

        try {
          // If content is empty or just whitespace, skip processing
          if (!jsonContent.trim() || jsonContent.trim() === '[]') {
            console.warn('⚠️ Empty or no analysis results returned');
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === questionId ? { ...q, isAnalyzingRelevance: false } : q,
              ),
            );
            return;
          }

          // Parse the AI response as JSON
          const analysisResults = JSON.parse(jsonContent);
          console.log('✅ Parsed analysis results:', analysisResults);
          console.log('📊 Analysis results count:', analysisResults.length);

          if (Array.isArray(analysisResults) && analysisResults.length > 0) {
            console.log('🎯 Updating search results with highlights...');

            // Validate that analysis results have the expected structure
            const validResults = analysisResults.filter(
              (result) =>
                result &&
                typeof result.index === 'number' &&
                typeof result.highlightedContent === 'string',
            );

            console.log(
              '✔️ Valid analysis results:',
              validResults.length,
              'of',
              analysisResults.length,
            );

            if (validResults.length > 0) {
              // Update search results with highlighted content
              setQuestions((prev) => {
                const updated = prev.map((q) =>
                  q.id === questionId
                    ? {
                        ...q,
                        searchResults: q.searchResults.map((result, index) => {
                          const analysis = validResults.find(
                            (a) => a.index === index,
                          );
                          const highlighted =
                            analysis?.highlightedContent || result.data;
                          console.log(`💡 Result ${index} highlighted:`, {
                            original: result.data.substring(0, 100),
                            highlighted: highlighted.substring(0, 100),
                            hasHighlights: highlighted !== result.data,
                            analysisFound: !!analysis,
                          });
                          return {
                            ...result,
                            highlightedData: highlighted,
                          };
                        }),
                        isAnalyzingRelevance: false,
                      }
                    : q,
                );
                console.log('📱 State updated with highlights');
                return updated;
              });
            } else {
              console.warn('⚠️ No valid analysis results found');
              setQuestions((prev) =>
                prev.map((q) =>
                  q.id === questionId
                    ? { ...q, isAnalyzingRelevance: false }
                    : q,
                ),
              );
            }
            console.log(
              '✅ Successfully analyzed relevance for question:',
              questionId,
            );
          } else {
            console.warn('AI response was not a valid array:', analysisResults);
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === questionId ? { ...q, isAnalyzingRelevance: false } : q,
              ),
            );
          }
        } catch (parseError) {
          console.warn('❌ Failed to parse AI analysis response:', parseError);
          console.warn('🔍 Raw response that failed to parse:', aiResponse);
          console.warn('📝 Attempted to parse as JSON:', jsonContent);

          // Try to extract any JSON-like content as a fallback
          const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              console.log('🔄 Attempting fallback JSON extraction...');
              const fallbackJson = JSON.parse(jsonMatch[0]);
              console.log('✅ Fallback parsing succeeded:', fallbackJson);

              if (Array.isArray(fallbackJson) && fallbackJson.length > 0) {
                // Use the fallback parsing result
                const validResults = fallbackJson.filter(
                  (result) =>
                    result &&
                    typeof result.index === 'number' &&
                    typeof result.highlightedContent === 'string',
                );

                if (validResults.length > 0) {
                  setQuestions((prev) =>
                    prev.map((q) =>
                      q.id === questionId
                        ? {
                            ...q,
                            searchResults: q.searchResults.map(
                              (result, index) => {
                                const analysis = validResults.find(
                                  (a) => a.index === index,
                                );
                                return {
                                  ...result,
                                  highlightedData:
                                    analysis?.highlightedContent || result.data,
                                };
                              },
                            ),
                            isAnalyzingRelevance: false,
                          }
                        : q,
                    ),
                  );
                  console.log('✅ Fallback highlighting applied');
                  return; // Exit successfully
                }
              }
            } catch (fallbackError) {
              console.warn('❌ Fallback parsing also failed:', fallbackError);
            }
          }

          // If all parsing attempts fail, just reset the state
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId ? { ...q, isAnalyzingRelevance: false } : q,
            ),
          );
        }
      } else {
        console.warn('AI analysis request failed:', response.status);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, isAnalyzingRelevance: false } : q,
          ),
        );
      }
    } catch (error) {
      console.warn('Error analyzing search result relevance:', error);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, isAnalyzingRelevance: false } : q,
        ),
      );
    }
  };

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

        // Filter duplicates if hideDuplicates is enabled
        let filteredResults = data.data || [];
        if (hideDuplicates) {
          filteredResults = filteredResults.filter((entry: any) => {
            if (seenIdsRef.current.has(entry.id)) {
              return false;
            }
            seenIdsRef.current.add(entry.id);
            return true;
          });

          // Update state to match ref
          setSeenIds(new Set(seenIdsRef.current));
        }

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  searchResults: filteredResults,
                  isLoadingSearch: false,
                }
              : q,
          ),
        );

        // Trigger AI analysis in the background (silently)
        if (filteredResults.length > 0) {
          console.log('🔥 Triggering AI analysis for question:', questionId);
          console.log(
            '📋 Filtered results structure:',
            filteredResults.map((r: any) => ({
              id: r.id,
              dataLength: r.data?.length || 0,
              hasData: !!r.data,
            })),
          );

          analyzeSearchResultRelevance(
            questionId,
            questionText,
            filteredResults,
          );
        } else {
          console.log(
            '⚠️ No filtered results to analyze for question:',
            questionId,
          );
        }

        // Load images for image entries if any
        const imageEntries = filteredResults.filter(
          (entry: any) => entry.metadata?.type === 'image',
        );
        if (imageEntries.length > 0) {
          const imageIds = imageEntries.map((entry: any) => entry.id);
          try {
            console.log('Fetching images for IDs:', imageIds);
            const imageResponse = await fetch('/api/fetchImageByIDs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: imageIds }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              console.log('Image response data:', imageData);

              // Check if imageData has the expected structure: imageData.data.body.urls
              if (
                imageData &&
                imageData.data &&
                imageData.data.body &&
                imageData.data.body.urls
              ) {
                const imageUrls = imageData.data.body.urls;

                // Update questions with image URLs
                setQuestions((prev) =>
                  prev.map((q) =>
                    q.id === questionId
                      ? {
                          ...q,
                          searchResults: q.searchResults.map((entry: any) => {
                            if (
                              entry.metadata?.type === 'image' &&
                              imageUrls[entry.id]
                            ) {
                              return {
                                ...entry,
                                tempImageUrl: imageUrls[entry.id],
                              };
                            }
                            return entry;
                          }),
                        }
                      : q,
                  ),
                );
              } else {
                console.warn('Unexpected image data structure:', imageData);
              }
            } else {
              console.error(
                'Image fetch failed:',
                imageResponse.status,
                imageResponse.statusText,
              );
            }
          } catch (imageError) {
            console.error('Error loading images:', imageError);
          }
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
            isLoadingWebResults: false,
            isAnalyzingRelevance: false,
            webResults: [],
          }));

          console.log('Parsed questions:', newQuestions);

          if (newQuestions.length > 0) {
            setQuestions(newQuestions);
            setIsGenerating(false);
            setSeenIds(new Set()); // Reset seen IDs for new questions
            seenIdsRef.current = new Set(); // Reset ref as well

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
        }
      } catch (error) {
        // Error handling
        if (currentOperation.type === 'questions') {
          setIsGenerating(false);
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
            webResults: [],
            isLoadingSearch: true,
            isLoadingResources: false,
            isLoadingWebResults: false,
            isAnalyzingRelevance: false,
          }));

          if (newQuestions.length > 0) {
            setQuestions(newQuestions);
            setIsGenerating(false);
            setSeenIds(new Set()); // Reset seen IDs for new questions
            seenIdsRef.current = new Set(); // Reset ref as well

            // Automatically search for all questions
            Promise.all(
              newQuestions.map((question) =>
                searchQuestionAutomatically(question.id, question.text),
              ),
            );
          } else {
            setIsGenerating(false);
          }
        }

        setCurrentOperation(null);
      }
    }
  }, [isLoading, messages, currentOperation]);

  // Effect to handle Hide Duplicates toggle
  useEffect(() => {
    if (questions.length > 0) {
      // When hideDuplicates is turned off, refetch all search results
      if (!hideDuplicates) {
        setSeenIds(new Set());
        seenIdsRef.current = new Set();
        questions.forEach((question) => {
          if (question.searchResults.length > 0) {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === question.id ? { ...q, isLoadingSearch: true } : q,
              ),
            );
            searchQuestionAutomatically(question.id, question.text);
          }
        });
      }
    }
  }, [hideDuplicates]);

  const handleGenerateQuestions = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setIsSearchingWeb(true);
    setQuestions([]);
    setMessages([]); // Clear previous messages
    setSeenIds(new Set()); // Reset seen IDs for new questions
    seenIdsRef.current = new Set(); // Reset ref as well

    try {
      console.log('🌐 Starting initial web search for topic:', topic.trim());

      // First, do a web search to get current context
      const webSearchResponse = await fetch(
        `/api/internetSearch?query=${encodeURIComponent(topic.trim())}`,
      );
      let webContext = '';

      if (webSearchResponse.ok) {
        const webData = await webSearchResponse.json();
        const webResults = webData.data || [];
        console.log('🔍 Web search found', webResults.length, 'results');

        if (webResults.length > 0) {
          webContext = `\n\nCurrent web search context:\n${webResults
            .slice(0, 5)
            .map(
              (result: any, index: number) =>
                `${index + 1}. ${result.title}: ${result.description}`,
            )
            .join('\n')}`;
        }
      } else {
        console.warn('⚠️ Web search failed:', webSearchResponse.status);
      }

      setIsSearchingWeb(false);

      const operation = { type: 'questions' as const };
      console.log('Setting currentOperation for questions:', operation);
      setCurrentOperation(operation);

      console.log('🤖 Calling append for questions with web context...');
      await append({
        role: 'user',
        content: `Generate 20 distinct questions about this topic: ${topic.trim()}. Make sure the questions are comprehensive and cover different aspects of the topic. Go as far as you can, go crazy. We pride ourselves on breadth, so ask really out there questions. You may want to think about associations leading to x leading to y leading to z and then post z. Current web context if its helpful (this is needed for jargon and terms you dont know): ${webContext}
        
Format each question as a numbered list (1. Question text, 2. Question text, etc.)`,
      });
      console.log('Append call completed for questions');
    } catch (error) {
      // Error generating questions
      console.error('Error in handleGenerateQuestions:', error);
      setIsGenerating(false);
      setIsSearchingWeb(false);
      setCurrentOperation(null);
    }
  };

  const handleGenerateResources = async (
    questionId: string,
    questionText: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, isLoadingWebResults: true } : q,
      ),
    );

    try {
      console.log('Calling web search for resources...');
      const response = await fetch(
        `/api/internetSearch?query=${encodeURIComponent(questionText)}`,
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Web search results:', data);

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  webResults: data.data || [],
                  isLoadingWebResults: false,
                }
              : q,
          ),
        );
      } else {
        console.error('Web search failed:', response.status);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, isLoadingWebResults: false } : q,
          ),
        );
      }
    } catch (error) {
      console.error('Error in handleGenerateResources:', error);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, isLoadingWebResults: false } : q,
        ),
      );
    }
  };

  const handleAddWebResult = async (
    webResult: WebResult,
    questionId: string,
  ) => {
    // Set adding state
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              webResults: q.webResults.map((result) =>
                result.url === webResult.url
                  ? { ...result, isAdding: true }
                  : result,
              ),
            }
          : q,
      ),
    );

    try {
      console.log('Adding web result to YCB:', webResult);
      const response = await fetch('/api/addWebResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: webResult.title,
          description: webResult.description,
          url: webResult.url,
        }),
      });

      if (response.ok) {
        console.log('Web result added successfully');
        // Set as successfully added
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  webResults: q.webResults.map((result) =>
                    result.url === webResult.url
                      ? { ...result, isAdding: false, isAdded: true }
                      : result,
                  ),
                }
              : q,
          ),
        );
      } else {
        console.error('Failed to add web result:', response.status);
        // Reset adding state on error
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  webResults: q.webResults.map((result) =>
                    result.url === webResult.url
                      ? { ...result, isAdding: false }
                      : result,
                  ),
                }
              : q,
          ),
        );
      }
    } catch (error) {
      console.error('Error adding web result:', error);
      // Reset adding state on error
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                webResults: q.webResults.map((result) =>
                  result.url === webResult.url
                    ? { ...result, isAdding: false }
                    : result,
                ),
              }
            : q,
        ),
      );
    }
  };

  const handleAddComment = (entry: SearchResult) => {
    setCurrentCommentEntry(entry);
    setCommentText('');
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!currentCommentEntry || !commentText.trim()) return;

    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: commentText.trim(),
          metadata: {
            title: 'Comment',
            author: 'https://yourcommonbase.com/dashboard/20questions',
            parent_id: currentCommentEntry.id,
          },
        }),
      });

      if (response.ok) {
        console.log('Comment added successfully');
        setIsCommentModalOpen(false);
        setCurrentCommentEntry(null);
        setCommentText('');
        // Could show a success toast here
      } else {
        console.error('Failed to add comment:', response.status);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="hide-duplicates"
                checked={hideDuplicates}
                onChange={(e) => setHideDuplicates(e.target.checked)}
                className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="hide-duplicates"
                className="text-sm font-medium text-gray-700"
              >
                Hide Duplicates
              </label>
            </div>
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
              {isSearchingWeb
                ? 'Searching Web...'
                : isGenerating ||
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
              {/* Sticky Question Header */}
              <div className="sticky top-0 z-10 rounded-t-lg border-b border-gray-200 bg-white">
                <CardHeader className="pb-3">
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
                        disabled={question.isLoadingWebResults}
                        className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                        type="button"
                      >
                        {question.isLoadingWebResults
                          ? 'Searching Web...'
                          : 'Generate Resources'}
                      </button>
                    </div>
                  </div>
                </CardHeader>
              </div>

              {/* Search Results */}
              {question.searchResults.length > 0 && (
                <CardContent>
                  <div className="mb-3 flex items-center gap-2">
                    <h4 className="font-medium text-gray-700">
                      Your Commonbase Results:
                    </h4>
                    {question.isAnalyzingRelevance && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="size-3 animate-spin rounded-full border border-gray-300 border-t-transparent" />
                        <span>Analyzing relevance...</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {question.searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="rounded-lg border border-gray-100 p-4"
                      >
                        {/* Title and Metadata */}
                        {result.metadata?.title && (
                          <div className="mb-2">
                            <h5 className="text-sm font-medium text-gray-800">
                              {result.metadata.title}
                            </h5>
                          </div>
                        )}

                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleQuickLook(result)}
                              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                              type="button"
                            >
                              Quick Look
                            </button>
                            <button
                              onClick={() =>
                                window.open(
                                  `/dashboard/entry/${result.id}`,
                                  '_blank',
                                )
                              }
                              className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200"
                              type="button"
                            >
                              Open Entry
                            </button>
                            <button
                              onClick={() => handleAddComment(result)}
                              className="rounded bg-green-100 px-2 py-1 text-xs text-green-600 hover:bg-green-200"
                              type="button"
                            >
                              Add Comment
                            </button>
                            {result.similarity && (
                              <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                {(result.similarity * 100).toFixed(1)}% match
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Handle image type entries */}
                        {result.metadata?.type === 'image' &&
                          result.tempImageUrl && (
                            <div className="mb-3">
                              <img
                                src={result.tempImageUrl}
                                alt="Content"
                                className="h-auto max-w-full rounded-lg"
                                style={{ maxHeight: '200px' }}
                                onError={(e) => {
                                  console.error('Image load error:', e);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log(
                                    'Image loaded successfully:',
                                    result.tempImageUrl,
                                  );
                                }}
                              />
                            </div>
                          )}

                        <div className="overflow-x-auto text-sm text-gray-900">
                          <ReactMarkdown
                            rehypePlugins={[rehypeRaw]}
                            className="prose prose-sm max-w-none"
                            components={{
                              pre: CustomPre,
                              code: CustomCode,
                            }}
                          >
                            {result.highlightedData || result.data}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {/* Web Search Results */}
              {question.isLoadingWebResults && (
                <CardContent>
                  <h4 className="mb-3 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                      Searching the web for resources...
                    </div>
                  </h4>
                </CardContent>
              )}

              {/* Web Results */}
              {question.webResults.length > 0 && (
                <CardContent>
                  <h4 className="mb-3 font-medium text-gray-700">
                    Web Resources:
                  </h4>
                  <div className="space-y-3">
                    {question.webResults.map((result, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-100 p-3"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <h5
                              className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={() => window.open(result.url, '_blank')}
                            >
                              {result.title}
                            </h5>
                            <div className="mt-1 text-xs text-gray-600">
                              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {result.description}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleAddWebResult(result, question.id)
                            }
                            disabled={result.isAdding || result.isAdded}
                            className={`ml-3 rounded-full p-1.5 transition-colors ${
                              result.isAdded
                                ? 'bg-green-500 text-white'
                                : result.isAdding
                                  ? 'bg-gray-200 text-gray-500'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                            type="button"
                            title={
                              result.isAdded
                                ? 'Added to YCB'
                                : result.isAdding
                                  ? 'Adding...'
                                  : 'Add to YCB'
                            }
                            aria-label={
                              result.isAdded
                                ? 'Added to YCB'
                                : result.isAdding
                                  ? 'Adding...'
                                  : 'Add to YCB'
                            }
                          >
                            {result.isAdding ? (
                              <svg
                                className="size-4 animate-spin"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            ) : result.isAdded ? (
                              <svg
                                className="size-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="size-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="truncate text-xs text-gray-500">
                          {result.url}
                        </div>
                      </div>
                    ))}
                  </div>
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

      {/* Comment Modal */}
      {isCommentModalOpen && currentCommentEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Add Comment
            </h3>
            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-600">Adding comment to:</p>
              <p className="text-sm font-medium text-gray-800">
                {currentCommentEntry.metadata?.title || 'Entry'}
              </p>
              <p className="line-clamp-2 text-xs text-gray-500">
                {currentCommentEntry.data.substring(0, 100)}...
              </p>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter your comment..."
              className="mb-4 h-32 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsCommentModalOpen(false);
                  setCurrentCommentEntry(null);
                  setCommentText('');
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                type="button"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

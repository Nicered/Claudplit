"use client";

import { useState } from "react";
import { MessageCircleQuestion, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AskUserQuestionData } from "@claudeship/shared";

interface AskUserQuestionBlockProps {
  data: AskUserQuestionData;
  isWaiting: boolean;
  onSubmit: (answers: Record<string, string>) => void;
}

export function AskUserQuestionBlock({ data, isWaiting, onSubmit }: AskUserQuestionBlockProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const handleSingleSelect = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const handleMultiSelect = (questionIndex: number, value: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[questionIndex] as string[]) || [];
      if (checked) {
        return { ...prev, [questionIndex]: [...current, value] };
      } else {
        return { ...prev, [questionIndex]: current.filter((v) => v !== value) };
      }
    });
  };

  const handleCustomInput = (questionIndex: number, value: string) => {
    setCustomInputs((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const handleSubmit = () => {
    const formattedAnswers: Record<string, string> = {};

    data.questions.forEach((question, index) => {
      const answer = answers[index];
      const customInput = customInputs[index];

      if (customInput) {
        formattedAnswers[question.question] = customInput;
      } else if (Array.isArray(answer)) {
        formattedAnswers[question.question] = answer.join(", ");
      } else if (answer) {
        formattedAnswers[question.question] = answer;
      }
    });

    onSubmit(formattedAnswers);
  };

  const isComplete = data.questions.every((_, index) => {
    return answers[index] || customInputs[index];
  });

  if (!isWaiting) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-muted border border-border">
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-muted-foreground">
          <MessageCircleQuestion className="h-4 w-4 inline mr-1" />
          질문 응답 완료
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <MessageCircleQuestion className="h-5 w-5" />
        <span className="font-medium">AI의 질문</span>
      </div>

      {data.questions.map((question, qIndex) => (
        <div key={qIndex} className="space-y-3">
          {question.header && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
              {question.header}
            </span>
          )}
          <p className="text-sm font-medium">{question.question}</p>

          {question.multiSelect ? (
            <div className="space-y-2">
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-start space-x-2">
                  <Checkbox
                    id={`q${qIndex}-o${oIndex}`}
                    checked={((answers[qIndex] as string[]) || []).includes(option.label)}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      handleMultiSelect(qIndex, option.label, checked === true)
                    }
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor={`q${qIndex}-o${oIndex}`} className="text-sm cursor-pointer">
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <RadioGroup
              value={answers[qIndex] as string}
              onValueChange={(value: string) => handleSingleSelect(qIndex, value)}
              className="space-y-2"
            >
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-start space-x-2">
                  <RadioGroupItem value={option.label} id={`q${qIndex}-o${oIndex}`} />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor={`q${qIndex}-o${oIndex}`} className="text-sm cursor-pointer">
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">또는 직접 입력:</span>
            <Input
              placeholder="다른 답변..."
              value={customInputs[qIndex] || ""}
              onChange={(e) => handleCustomInput(qIndex, e.target.value)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={!isComplete}
        className="w-full"
        size="sm"
      >
        답변 제출
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  MousePointer2,
  Move,
  Maximize2,
  Type,
  Palette,
  Box,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SelectedElement {
  selector: string;
  tagName: string;
  className: string;
  id: string;
  styles: Record<string, string>;
  rect: DOMRect;
}

interface VisualEditorProps {
  projectId: string;
  previewUrl: string;
}

const STYLE_CATEGORIES = {
  layout: ["display", "position", "width", "height", "margin", "padding"],
  typography: ["font-size", "font-weight", "color", "text-align", "line-height"],
  background: ["background-color", "background-image", "opacity"],
  border: ["border", "border-radius", "box-shadow"],
};

export function VisualEditor({ projectId, previewUrl }: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [editedStyles, setEditedStyles] = useState<Record<string, string>>({});

  // Inject editor script into iframe
  const injectEditorScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const script = `
      (function() {
        if (window.__visualEditorInjected) return;
        window.__visualEditorInjected = true;

        let hoveredElement = null;
        let selectedElement = null;
        const overlay = document.createElement('div');
        overlay.id = '__visual-editor-overlay';
        overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);transition:all 0.1s;display:none;';
        document.body.appendChild(overlay);

        const selectionOverlay = document.createElement('div');
        selectionOverlay.id = '__visual-editor-selection';
        selectionOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99998;border:2px solid #10b981;background:rgba(16,185,129,0.1);display:none;';
        document.body.appendChild(selectionOverlay);

        function getSelector(el) {
          if (el.id) return '#' + el.id;
          if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ').filter(c => c && !c.startsWith('__'));
            if (classes.length) return el.tagName.toLowerCase() + '.' + classes.join('.');
          }
          return el.tagName.toLowerCase();
        }

        function getStyles(el) {
          const computed = window.getComputedStyle(el);
          return {
            'display': computed.display,
            'position': computed.position,
            'width': computed.width,
            'height': computed.height,
            'margin': computed.margin,
            'padding': computed.padding,
            'font-size': computed.fontSize,
            'font-weight': computed.fontWeight,
            'color': computed.color,
            'text-align': computed.textAlign,
            'line-height': computed.lineHeight,
            'background-color': computed.backgroundColor,
            'border': computed.border,
            'border-radius': computed.borderRadius,
            'box-shadow': computed.boxShadow,
            'opacity': computed.opacity,
          };
        }

        document.addEventListener('mousemove', function(e) {
          if (!window.__visualEditorEnabled) return;

          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (!el || el === overlay || el === selectionOverlay) return;
          if (el === hoveredElement) return;

          hoveredElement = el;
          const rect = el.getBoundingClientRect();
          overlay.style.display = 'block';
          overlay.style.left = rect.left + 'px';
          overlay.style.top = rect.top + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';

          window.parent.postMessage({
            type: 'visualEditor:hover',
            rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
          }, '*');
        });

        document.addEventListener('click', function(e) {
          if (!window.__visualEditorEnabled) return;
          e.preventDefault();
          e.stopPropagation();

          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (!el || el === overlay || el === selectionOverlay) return;

          selectedElement = el;
          const rect = el.getBoundingClientRect();
          selectionOverlay.style.display = 'block';
          selectionOverlay.style.left = rect.left + 'px';
          selectionOverlay.style.top = rect.top + 'px';
          selectionOverlay.style.width = rect.width + 'px';
          selectionOverlay.style.height = rect.height + 'px';

          window.parent.postMessage({
            type: 'visualEditor:select',
            element: {
              selector: getSelector(el),
              tagName: el.tagName.toLowerCase(),
              className: el.className || '',
              id: el.id || '',
              styles: getStyles(el),
              rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
            }
          }, '*');
        }, true);

        window.addEventListener('message', function(e) {
          if (e.data.type === 'visualEditor:enable') {
            window.__visualEditorEnabled = true;
            document.body.style.cursor = 'crosshair';
          } else if (e.data.type === 'visualEditor:disable') {
            window.__visualEditorEnabled = false;
            document.body.style.cursor = '';
            overlay.style.display = 'none';
            selectionOverlay.style.display = 'none';
          } else if (e.data.type === 'visualEditor:updateStyle' && selectedElement) {
            selectedElement.style[e.data.property] = e.data.value;
          }
        });
      })();
    `;

    try {
      const doc = iframe.contentDocument;
      if (doc) {
        // Remove existing script if any
        const existing = doc.getElementById("__visual-editor-script");
        if (existing) existing.remove();

        const scriptEl = doc.createElement("script");
        scriptEl.id = "__visual-editor-script";
        scriptEl.textContent = script;
        doc.body.appendChild(scriptEl);
      }
    } catch {
      // Cross-origin - can't inject script
      console.warn("Visual editor: Cannot inject script (cross-origin)");
    }
  }, []);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "visualEditor:hover") {
        setHoveredRect(e.data.rect);
      } else if (e.data.type === "visualEditor:select") {
        setSelectedElement(e.data.element);
        setEditedStyles(e.data.element.styles);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Toggle editor mode
  const toggleEditor = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    if (!isEnabled) {
      injectEditorScript();
      iframe.contentWindow.postMessage({ type: "visualEditor:enable" }, "*");
    } else {
      iframe.contentWindow.postMessage({ type: "visualEditor:disable" }, "*");
      setSelectedElement(null);
      setHoveredRect(null);
    }
    setIsEnabled(!isEnabled);
  }, [isEnabled, injectEditorScript]);

  // Update style
  const updateStyle = (property: string, value: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !selectedElement) return;

    setEditedStyles((prev) => ({ ...prev, [property]: value }));
    iframe.contentWindow.postMessage(
      { type: "visualEditor:updateStyle", property, value },
      "*"
    );
  };

  // Generate Tailwind classes (simplified)
  const generateTailwindClass = (property: string, value: string): string => {
    // This is a simplified version - full implementation would need more mappings
    const mappings: Record<string, Record<string, string>> = {
      display: { flex: "flex", grid: "grid", block: "block", none: "hidden" },
      "text-align": { center: "text-center", left: "text-left", right: "text-right" },
      "font-weight": { "700": "font-bold", "600": "font-semibold", "400": "font-normal" },
    };

    return mappings[property]?.[value] || "";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-medium flex items-center gap-2">
          <MousePointer2 className="h-4 w-4" />
          Visual Editor
        </h3>
        <Button
          variant={isEnabled ? "secondary" : "outline"}
          size="sm"
          onClick={toggleEditor}
        >
          {isEnabled ? "Disable" : "Enable"} Inspector
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Preview */}
        <div className="flex-1 bg-muted/30 relative">
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            onLoad={injectEditorScript}
          />
          {isEnabled && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
              Inspector Mode
            </div>
          )}
        </div>

        {/* Style Panel */}
        {selectedElement && (
          <div className="w-72 border-l overflow-auto">
            <div className="p-4 space-y-4">
              {/* Element Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Selected Element</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedElement(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <code className="block text-xs bg-muted p-2 rounded">
                  {selectedElement.selector}
                </code>
              </div>

              {/* Layout */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Box className="h-4 w-4" />
                  Layout
                </div>
                {STYLE_CATEGORIES.layout.map((prop) => (
                  <div key={prop} className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20 shrink-0">
                      {prop}
                    </label>
                    <Input
                      value={editedStyles[prop] || ""}
                      onChange={(e) => updateStyle(prop, e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Typography */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Type className="h-4 w-4" />
                  Typography
                </div>
                {STYLE_CATEGORIES.typography.map((prop) => (
                  <div key={prop} className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20 shrink-0">
                      {prop}
                    </label>
                    <Input
                      value={editedStyles[prop] || ""}
                      onChange={(e) => updateStyle(prop, e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Background */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Palette className="h-4 w-4" />
                  Background
                </div>
                {STYLE_CATEGORIES.background.map((prop) => (
                  <div key={prop} className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20 shrink-0">
                      {prop}
                    </label>
                    <Input
                      value={editedStyles[prop] || ""}
                      onChange={(e) => updateStyle(prop, e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Border */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Maximize2 className="h-4 w-4" />
                  Border
                </div>
                {STYLE_CATEGORIES.border.map((prop) => (
                  <div key={prop} className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20 shrink-0">
                      {prop}
                    </label>
                    <Input
                      value={editedStyles[prop] || ""}
                      onChange={(e) => updateStyle(prop, e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Note */}
              <p className="text-xs text-muted-foreground mt-4">
                Changes are preview only. Use the AI to update source code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

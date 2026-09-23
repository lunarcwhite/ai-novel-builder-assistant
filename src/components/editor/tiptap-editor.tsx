"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { countWords } from "@/lib/words";

interface TipTapEditorProps {
  initialContent: string;
  onChange: (content: string, wordCount: number) => void;
  placeholder?: string;
  editable?: boolean;
}

export default function TipTapEditor({
  initialContent,
  onChange,
  placeholder = "Mulai menulis naskah adegan ini...",
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty before:text-muted-foreground/40 before:content-[attr(data-placeholder)] before:float-left before:pointer-events-none before:h-0",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer hover:text-primary/80 transition-colors",
        },
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[600px] text-lg font-serif text-foreground/90 leading-[1.9] tracking-normal selection:bg-primary/20",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const words = countWords(ed.getText());
      onChange(html, words);
    },
  });

  // Keep editor content in sync when restored or changed externally
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (initialContent !== currentHtml) {
      editor.commands.setContent(initialContent || "", false);
    }
  }, [initialContent, editor]);

  if (!editor) {
    return (
      <div className="min-h-[500px] flex items-center justify-center text-muted-foreground font-serif italic text-sm animate-pulse">
        Mempersiapkan lembar kerja naskah...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL tautan:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="relative w-full">
      {/* Floating Selection Bubble Menu (Editorial quick format) */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150, placement: "top" }}
        className="flex items-center gap-0.5 p-1 rounded-lg border border-border/80 bg-popover/95 backdrop-blur-md shadow-card text-xs z-30"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-muted/80 transition-colors ${
            editor.isActive("bold") ? "text-primary bg-primary/10 font-bold" : "text-muted-foreground"
          }`}
          title="Tebal (Bold)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-muted/80 transition-colors ${
            editor.isActive("italic") ? "text-primary bg-primary/10 italic" : "text-muted-foreground"
          }`}
          title="Miring (Italic)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-muted/80 transition-colors ${
            editor.isActive("blockquote") ? "text-primary bg-primary/10" : "text-muted-foreground"
          }`}
          title="Kutipan (Blockquote)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded hover:bg-muted/80 transition-colors ${
            editor.isActive("link") ? "text-primary bg-primary/10" : "text-muted-foreground"
          }`}
          title="Tautan"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-border/60 mx-1" />

        {/* AI Action Teaser Placeholder (Task 4.2 / Phase 7 ready) */}
        <div
          className="flex items-center gap-1 px-1.5 py-1 text-[11px] text-primary/80 font-sans cursor-default select-none opacity-80"
          title="Asisten AI akan aktif di Phase 7"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span>AI Refine (Phase 7)</span>
        </div>
      </BubbleMenu>

      {/* Editor Fixed Header Toolbar */}
      <div className="sticky top-0 z-20 mb-6 py-2 px-3 rounded-lg border border-border/60 bg-background/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-1 shadow-xs transition-all">
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`h-7 px-2 text-xs font-serif ${
              editor.isActive("heading", { level: 1 }) ? "bg-muted text-primary font-bold" : "text-muted-foreground"
            }`}
            title="Judul 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-7 px-2 text-xs font-serif ${
              editor.isActive("heading", { level: 2 }) ? "bg-muted text-primary font-bold" : "text-muted-foreground"
            }`}
            title="Judul 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`h-7 px-2 text-xs font-serif ${
              editor.isActive("heading", { level: 3 }) ? "bg-muted text-primary font-bold" : "text-muted-foreground"
            }`}
            title="Judul 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </Button>

          <div className="w-[1px] h-4 bg-border/60 mx-1" />

          {/* Formats */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-7 w-7 p-0 ${
              editor.isActive("bold") ? "bg-muted text-primary font-bold" : "text-muted-foreground"
            }`}
            title="Tebal (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-7 w-7 p-0 ${
              editor.isActive("italic") ? "bg-muted text-primary italic" : "text-muted-foreground"
            }`}
            title="Miring (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-7 w-7 p-0 ${
              editor.isActive("blockquote") ? "bg-muted text-primary" : "text-muted-foreground"
            }`}
            title="Kutipan (Blockquote)"
          >
            <Quote className="w-3.5 h-3.5" />
          </Button>

          <div className="w-[1px] h-4 bg-border/60 mx-1" />

          {/* Lists */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-7 w-7 p-0 ${
              editor.isActive("bulletList") ? "bg-muted text-primary" : "text-muted-foreground"
            }`}
            title="Daftar Poin"
          >
            <List className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-7 w-7 p-0 ${
              editor.isActive("orderedList") ? "bg-muted text-primary" : "text-muted-foreground"
            }`}
            title="Daftar Angka"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={`h-7 w-7 p-0 ${
              editor.isActive("link") ? "bg-muted text-primary" : "text-muted-foreground"
            }`}
            title="Tautan"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-7 w-7 p-0 text-muted-foreground disabled:opacity-30"
            title="Urungkan (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-7 w-7 p-0 text-muted-foreground disabled:opacity-30"
            title="Ulangi (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Manuscript Writing Canvas */}
      <div className="manuscript-canvas px-1 sm:px-2 focus-within:ring-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

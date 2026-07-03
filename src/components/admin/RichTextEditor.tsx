import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Highlighter,
  Palette,
  Quote,
  Heading2,
  ChevronDown,
  FileJson,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const COLORS = ["#0F172A", "#6B4EFF", "#E8A365", "#16A34A", "#DC2626", "#0891B2"];
const HIGHLIGHTS = ["#FEF3C7", "#DBEAFE", "#FCE7F3", "#DCFCE7", "#F3E8FF"];

function ToolbarBtn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-xs transition ${
        active ? "bg-[#6B4EFF] text-white" : "bg-white/70 text-slate-600 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const insertMore = () => {
    editor.chain().focus().insertContent("<p>[[more]]</p><p></p>").run();
  };

  const onLottieFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") throw new Error("bad");
    } catch {
      toast.error("Archivo JSON de animación inválido");
      return;
    }
    const align =
      (window.prompt("Alineación de la animación: left / center / right", "center") || "center")
        .trim()
        .toLowerCase();
    const safeAlign = ["left", "center", "right"].includes(align) ? align : "center";

    const path = `lottie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
    const toastId = toast.loading("Subiendo animación…");
    const { error } = await supabase.storage
      .from("lottie-animations")
      .upload(path, new Blob([text], { type: "application/json" }), {
        contentType: "application/json",
        upsert: false,
      });
    if (error) {
      toast.error(`No se pudo subir: ${error.message}`, { id: toastId });
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent(`<p>[[lottie:storage://${path}:${safeAlign}]]</p><p></p>`)
      .run();
    toast.success("Animación insertada", { id: toastId });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-slate-200 bg-slate-50 p-2">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onLottieFile}
      />

      <ToolbarBtn title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={14} />
      </ToolbarBtn>
      <ToolbarBtn title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={14} />
      </ToolbarBtn>
      <ToolbarBtn title="Subrayado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={14} />
      </ToolbarBtn>
      <ToolbarBtn title="Título" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={14} />
      </ToolbarBtn>
      <ToolbarBtn title="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Enlace"
        active={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("URL", editor.getAttributes("link").href ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        <LinkIcon size={14} />
      </ToolbarBtn>

      <div className="mx-1 h-6 w-px bg-slate-300" />

      <div className="flex items-center gap-1">
        <Palette size={14} className="text-slate-500" />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={`Color ${c}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setColor(c).run();
            }}
            className="h-5 w-5 rounded-full ring-1 ring-slate-300"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-slate-300" />

      <div className="flex items-center gap-1">
        <Highlighter size={14} className="text-slate-500" />
        {HIGHLIGHTS.map((c) => (
          <button
            key={c}
            type="button"
            title={`Resaltar ${c}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHighlight({ color: c }).run();
            }}
            className="h-5 w-5 rounded-md ring-1 ring-slate-300"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-slate-300" />

      <button
        type="button"
        title="Insertar punto 'Más' (revelar más al lector)"
        onMouseDown={(e) => {
          e.preventDefault();
          insertMore();
        }}
        className="flex h-8 items-center gap-1 rounded-md bg-white/70 px-2 text-[11px] font-semibold text-slate-600 hover:bg-white"
      >
        <ChevronDown size={12} /> Más
      </button>
      <button
        type="button"
        title="Insertar animación Lottie (.json)"
        onMouseDown={(e) => {
          e.preventDefault();
          fileRef.current?.click();
        }}
        className="flex h-8 items-center gap-1 rounded-md bg-white/70 px-2 text-[11px] font-semibold text-slate-600 hover:bg-white"
      >
        <FileJson size={12} /> Animación
      </button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#6B4EFF] underline" } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[200px] rounded-b-lg border border-slate-200 bg-white px-4 py-3 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;
  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

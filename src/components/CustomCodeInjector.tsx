import { useEffect, useRef } from "react";
import { usePublicConfig } from "@/services/public-config";

/**
 * 为公开展示页注入自定义代码：
 * - custom_headers → <head>（原生 DOM 注入，确保 script 可执行）
 * - custom_body   → <body> 末尾（原生 DOM 注入）
 * - app_name      → document.title
 * - favicon_url   → <link rel="icon">
 */
export function CustomCodeInjector() {
  const { data } = usePublicConfig();
  const headNodesRef = useRef<Node[]>([]);
  const bodyContainerRef = useRef<HTMLDivElement | null>(null);

  const customHeaders = data?.custom_headers ?? "";
  const customBody = data?.custom_body ?? "";
  const appName = data?.app_name ?? "";
  const faviconUrl = data?.favicon_url ?? "";

  // ── 动态标题 ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (data) {
      document.title = appName || "Collei";
    }
  }, [data, appName]);

  // ── 动态 Favicon ───────────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) return;

    if (faviconUrl) {
      link.href = faviconUrl;
    } else {
      link.href = "/api/v1/public/favicon";
    }
  }, [faviconUrl]);

  // ── Head 注入 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // 清理上一次注入的节点
    headNodesRef.current.forEach((node) => node.parentNode?.removeChild(node));
    headNodesRef.current = [];

    if (!customHeaders) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<head>${customHeaders}</head>`, "text/html");
    const injected: Node[] = [];

    doc.head.childNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (tag === "script") {
        // script 必须通过 createElement 重新创建才会执行
        const script = document.createElement("script");
        Array.from(el.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });
        script.textContent = el.textContent;
        document.head.appendChild(script);
        injected.push(script);
      } else {
        // style / link / meta 等标签直接克隆即可
        const clone = document.importNode(el, true);
        document.head.appendChild(clone);
        injected.push(clone);
      }
    });

    headNodesRef.current = injected;

    return () => {
      headNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
      headNodesRef.current = [];
    };
  }, [customHeaders]);

  // ── Body 注入 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!customBody) {
      // 清理已有容器
      if (bodyContainerRef.current) {
        bodyContainerRef.current.remove();
        bodyContainerRef.current = null;
      }
      return;
    }

    // 创建或复用容器
    let container = bodyContainerRef.current;
    if (!container) {
      container = document.createElement("div");
      container.id = "custom-body-inject";
      document.body.appendChild(container);
      bodyContainerRef.current = container;
    }

    container.innerHTML = customBody;

    // innerHTML 不会执行 <script>，需手动提取并重新创建
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      // 复制所有属性
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });

    return () => {
      if (bodyContainerRef.current) {
        bodyContainerRef.current.remove();
        bodyContainerRef.current = null;
      }
    };
  }, [customBody]);

  return null;
}

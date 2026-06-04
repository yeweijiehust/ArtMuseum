import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GalleryImage } from "@artmuseum/shared";
import { App, queryClient } from "./App.js";
import "./i18n.js";

const sampleImage: GalleryImage = {
  id: "image-1",
  ownerId: "user-1",
  ownerDisplayName: "Ada",
  url: "https://images.example.test/image.jpg",
  width: 1200,
  height: 800,
  format: "jpg",
  bytes: 400,
  title: "Morning Lake",
  description: "Still water",
  altText: "A lake at sunrise",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

beforeEach(() => {
  queryClient.clear();
  window.localStorage.clear();
  window.history.pushState({}, "", "/en");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Art Museum frontend", () => {
  it("renders Chinese routes with translated gallery text", async () => {
    mockFetch({ images: [] });
    window.history.pushState({}, "", "/zh");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "公共画廊" })).toBeInTheDocument();
    expect(await screen.findByText("还没有作品")).toBeInTheDocument();
  });

  it("switches language while preserving the current page", async () => {
    mockFetch({ images: [] });
    window.history.pushState({}, "", "/en/login");
    render(<App />);
    await screen.findByRole("heading", { name: "Log in" });
    await userEvent.click(screen.getByRole("button", { name: "中文" }));
    await waitFor(() => expect(window.location.pathname).toBe("/zh/login"));
    expect(await screen.findByText("邮箱")).toBeInTheDocument();
  });

  it("opens and closes the image lightbox", async () => {
    mockFetch({ images: [sampleImage] });
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: /Morning Lake/ }));
    expect(screen.getByRole("dialog", { name: "Morning Lake" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("validates the upload form before submitting", async () => {
    mockFetch({ meStatus: 200, images: [] });
    window.history.pushState({}, "", "/en/upload");
    render(<App />);
    await screen.findByRole("heading", { name: "Upload image" });
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Choose one image file.")).toBeInTheDocument();
  });
});

function mockFetch(options: { images?: GalleryImage[]; meStatus?: number }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
    if (url.endsWith("/api/auth/me")) {
      if (options.meStatus === 200) {
        return jsonResponse(200, {
          user: {
            id: "user-1",
            email: "ada@example.com",
            displayName: "Ada",
            createdAt: "2026-01-01T00:00:00.000Z"
          }
        });
      }
      return jsonResponse(401, { error: { code: "UNAUTHORIZED", message: "UNAUTHORIZED" } });
    }
    if (url.endsWith("/api/images")) {
      return jsonResponse(200, { items: options.images ?? [], nextCursor: null });
    }
    if (url.endsWith("/api/images/mine")) {
      return jsonResponse(200, { items: [], nextCursor: null });
    }
    return jsonResponse(200, {});
  });
  vi.stubGlobal("fetch", fetchMock);
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

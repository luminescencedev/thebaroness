import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandLoader } from "./BrandLoader";
import { BrandMark } from "./BrandMark";
import { Medallion } from "./Medallion";

describe("marque", () => {
  it("expose un nom accessible et l'état de chargement", () => {
    const { rerender } = render(<BrandMark size={30} />);
    const mark = screen.getByRole("img", { name: "The Baroness" });
    expect(mark).toHaveAttribute("data-loading", "false");
    rerender(<BrandMark size={96} loading />);
    expect(screen.getByRole("img", { name: "The Baroness" })).toHaveAttribute(
      "data-loading",
      "true",
    );
  });

  it("le médaillon est décoratif sans titre et nommé avec un titre", () => {
    const { container, rerender } = render(<Medallion size={26} />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<Medallion size={26} title="Médaillon" />);
    expect(screen.getByRole("img", { name: "Médaillon" })).toBeInTheDocument();
  });

  it("le chargeur reste muet visuellement tant que l'attente est courte", () => {
    render(<BrandLoader message="Le Doorman monte les parties" />);
    expect(screen.queryByRole("img", { name: "The Baroness" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Le Doorman monte les parties");
  });
});

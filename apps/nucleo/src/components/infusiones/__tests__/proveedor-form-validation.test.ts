import { describe, it, expect, vi } from "vitest";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proveedorFormSchema, type ProveedorFormValues } from "@/lib/infusiones-types";

describe("Proveedor Form Validation", () => {
  it("should validate and call submit with valid data", async () => {
    let formValues: any = null;
    let formErrors: any = null;

    const DEFAULT_VALUES: ProveedorFormValues = {
      nombre: '',
      contacto: undefined,
      ubicacion: undefined,
      notas: undefined,
    };

    // Simulate what react-hook-form does
    const resolver = zodResolver(proveedorFormSchema);

    // Test with values as React Hook Form collects them from uncontrolled inputs
    // In DOM, empty inputs return ""
    const inputFromDom = {
      nombre: "Stevia Chillan",
      contacto: "+56957419603",
      ubicacion: "",
      notas: "",
    };

    const result = await resolver(inputFromDom, undefined, {
      criteriaMode: "firstError",
      fields: {},
      shouldUseNativeValidation: false,
    });

    console.log("Resolver result with empty strings:", JSON.stringify(result));
    expect(result.errors).toEqual({});

    // Test with undefined
    const inputWithUndefined = {
      nombre: "Stevia Chillan",
      contacto: "+56957419603",
      ubicacion: undefined,
      notas: undefined,
    };

    const result2 = await resolver(inputWithUndefined, undefined, {
      criteriaMode: "firstError",
      fields: {},
      shouldUseNativeValidation: false,
    });

    console.log("Resolver result with undefined:", JSON.stringify(result2));
    expect(result2.errors).toEqual({});
  });
});

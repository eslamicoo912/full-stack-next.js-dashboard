"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateOrUpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customer_id, amount, status } = CreateOrUpdateInvoice.parse({
    customer_id: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES(${customer_id}, ${amountInCents}, ${status}, ${date})`;
  } catch (error) {
    console.log("error: ", error);
    throw new Error("ERROR: failed to create invoice");
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customer_id, amount, status } = CreateOrUpdateInvoice.parse({
    customer_id: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  try {
    await sql`UPDATE invoices SET customer_id=${customer_id}, amount=${amountInCents}, status=${status} WHERE id=${id}`;
  } catch (error) {
    console.log("error: ", error);
    throw new Error("ERROR: failed to update invoice");
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  throw new Error("ERROR: failed to delete invoice");

  try {
    await sql`DELETE FROM invoices WHERE id=${id}`;
  } catch (error) {
    console.log("error: ", error);
    throw new Error("ERROR: failed to delete invoice");
  }
  revalidatePath("/dashboard/invoices");
}

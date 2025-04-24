import { signIn } from "@/auth";

export default function SignIn() {
  return (
    <div>
      signin
      <form
        action={async () => {
          "use server";
          await signIn(undefined, {
            redirectTo: "/editor",
          });
        }}
      >
        <button type="submit">Signin</button>
      </form>
    </div>
  );
}

import { auth } from "@/auth";

import CoverEditor from "@/components/stage";

export default async function Editor() {
  const session: any = await auth();
  console.log("session", JSON.stringify(session));
  if (!session?.user) {
    return <div>not login</div>;
  }
  return (
    <div>
      Hi {session.user.name},Editor
      <CoverEditor>111</CoverEditor>
    </div>
  );
}

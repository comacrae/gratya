/*stand in for @/lib/supabase; tests register a fake user and get back a token. 
Then when requireUser calls supabase.auth.getUser(token), the fake looks it up*/
type AuthUserMock = {
  user_metadata: { display_name: string };
  email: string;
  id: string; // uuid
};
const mockUsers = new Map<string, AuthUserMock>(); // jwt -> mock User
let counter = 0; // for building the jwts

export const tokenFor = (user: {
  id: string;
  displayName: string;
  email: string;
}): string => {
  /*given a user, build a token and then store an Auth User mock in the map. return the JWT*/
  const tok = `header.user-${counter++}.signature`;
  mockUsers.set(tok, {
    user_metadata: { display_name: user.displayName },
    id: user.id,
    email: user.email,
  });
  return `Bearer ${tok}`;
};

export const supabase = {
  auth: {
    getUser: (jwt: string) =>
      mockUsers.has(jwt)
        ? { data: { user: mockUsers.get(jwt) }, error: null }
        : { data: { user: null }, error: { message: "not found" } },
  },
};

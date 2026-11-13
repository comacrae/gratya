1. added an sqs queue to specs to ground aws experience in project
2. renamed next js service from api to server to make naming cleaner

Why there's no shared ESLint config

The spec says "ESLint + Prettier config shared across workspaces." Prettier is shared, through the one root .prettierrc. Sharing ESLint doesn't pay off right now: the two apps need different presets (eslint-config-next and eslint-config-expo), and you don't have a single custom rule in common yet. A shared config would mean a new packages/eslint-config package containing nothing. Build it when you have something to put in it, like the M2 no-floating-promises rule, if you want it in both apps.

11/13-26 - m0.9: stack, main only branching, data api off with rls by migration, session pooler for migrations, rename of app, @gratya scope, typescript 6, no shared eslint config yet

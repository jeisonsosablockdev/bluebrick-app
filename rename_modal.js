const fs = require('fs');

const files = [
  'app/checkout/page.tsx',
  'app/marketplace/[id]/page.tsx',
  'app/marketplace/page.tsx',
  'app/page.tsx',
  'app/transparencia/page.tsx',
  'components/admin/admin-shell.tsx',
  'components/dashboard/protected-shell.tsx',
  'tests/app/marketplace-page.test.ts',
  'tests/components/wallet-modal-header-cta.test.ts',
  'components/main-top-navigation-modal.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ WalletModal \} from "@\/components\/WalletModal";/g, 'import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";');
  content = content.replace(/<WalletModal/g, '<MainTopNavigationModal');
  content = content.replace(/export function WalletModal\(/g, 'export function MainTopNavigationModal(');
  content = content.replace(/createElement\(WalletModal,/g, 'createElement(MainTopNavigationModal,');
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}

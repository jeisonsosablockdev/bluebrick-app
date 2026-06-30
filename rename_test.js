const fs = require('fs');
let file = 'tests/components/wallet-modal-header-cta.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/WalletModal/g, 'MainTopNavigationModal');
content = content.replace(/import \{ MainTopNavigationModal \} from "@\/components\/MainTopNavigationModal";/g, 'import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";');
fs.writeFileSync(file, content, 'utf8');
console.log('updated test');

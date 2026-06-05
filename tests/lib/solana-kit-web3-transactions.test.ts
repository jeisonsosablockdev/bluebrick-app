import { describe, expect, it } from "vitest";

import {
  getLegacyTransactionMessageMismatchReasons,
  legacyTransactionMessageMatchesPreparedAction,
  serializeLegacyVersionedMessage
} from "@/lib/solana-kit/compat/web3-transactions";

async function loadWeb3TestTools() {
  return import("@solana/web3.js");
}

type Web3TestTools = Awaited<ReturnType<typeof loadWeb3TestTools>>;
type TestPublicKey = InstanceType<Web3TestTools["PublicKey"]>;
type TestTransaction = Parameters<typeof serializeLegacyVersionedMessage>[0];

function randomBlockhash(generateKeypair: () => { publicKey: TestPublicKey }): string {
  return generateKeypair().publicKey.toBase58();
}

async function createTransferTransaction(input: {
  payer: TestPublicKey;
  recipient: TestPublicKey;
  blockhash: string;
  lamports: number;
  includeComputeBudget?: boolean;
  includeExtraTransfer?: boolean;
}): Promise<TestTransaction> {
  const {
    ComputeBudgetProgram,
    SystemProgram,
    TransactionMessage,
    VersionedTransaction
  } = await loadWeb3TestTools();
  const instructions = [
    ...(input.includeComputeBudget
      ? [
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 })
        ]
      : []),
    SystemProgram.transfer({
      fromPubkey: input.payer,
      toPubkey: input.recipient,
      lamports: input.lamports
    }),
    ...(input.includeExtraTransfer
      ? [
          SystemProgram.transfer({
            fromPubkey: input.payer,
            toPubkey: input.recipient,
            lamports: input.lamports
          })
        ]
      : [])
  ];
  const message = new TransactionMessage({
    payerKey: input.payer,
    recentBlockhash: input.blockhash,
    instructions
  }).compileToV0Message();

  return new VersionedTransaction(message);
}

describe("solana-kit web3 transaction boundary", () => {
  it("accepts a signed transaction when only the recent blockhash changed", async () => {
    const { Keypair } = await loadWeb3TestTools();
    const payer = Keypair.generate().publicKey;
    const recipient = Keypair.generate().publicKey;
    const prepared = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });
    const signedWithRefreshedBlockhash = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });

    expect(legacyTransactionMessageMatchesPreparedAction(
      signedWithRefreshedBlockhash,
      serializeLegacyVersionedMessage(prepared)
    )).toBe(true);
    expect(getLegacyTransactionMessageMismatchReasons(
      signedWithRefreshedBlockhash,
      serializeLegacyVersionedMessage(prepared)
    )).toEqual([]);
  });

  it("rejects a signed transaction when the instruction data changes", async () => {
    const { Keypair } = await loadWeb3TestTools();
    const payer = Keypair.generate().publicKey;
    const recipient = Keypair.generate().publicKey;
    const prepared = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });
    const changedAmount = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 2
    });

    expect(legacyTransactionMessageMatchesPreparedAction(
      changedAmount,
      serializeLegacyVersionedMessage(prepared)
    )).toBe(false);
    expect(getLegacyTransactionMessageMismatchReasons(
      changedAmount,
      serializeLegacyVersionedMessage(prepared)
    )).toEqual(["compiledInstructions"]);
  });

  it("rejects a signed transaction when the account list changes", async () => {
    const { Keypair } = await loadWeb3TestTools();
    const payer = Keypair.generate().publicKey;
    const prepared = await createTransferTransaction({
      payer,
      recipient: Keypair.generate().publicKey,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });
    const changedRecipient = await createTransferTransaction({
      payer,
      recipient: Keypair.generate().publicKey,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });

    expect(legacyTransactionMessageMatchesPreparedAction(
      changedRecipient,
      serializeLegacyVersionedMessage(prepared)
    )).toBe(false);
    expect(getLegacyTransactionMessageMismatchReasons(
      changedRecipient,
      serializeLegacyVersionedMessage(prepared)
    )).toEqual(["compiledInstructions"]);
  });

  it("accepts wallet-added leading compute budget instructions", async () => {
    const { Keypair } = await loadWeb3TestTools();
    const payer = Keypair.generate().publicKey;
    const recipient = Keypair.generate().publicKey;
    const prepared = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });
    const signedWithComputeBudget = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1,
      includeComputeBudget: true
    });

    expect(legacyTransactionMessageMatchesPreparedAction(
      signedWithComputeBudget,
      serializeLegacyVersionedMessage(prepared)
    )).toBe(true);
    expect(getLegacyTransactionMessageMismatchReasons(
      signedWithComputeBudget,
      serializeLegacyVersionedMessage(prepared)
    )).toEqual([]);
  });

  it("rejects non-compute-budget extra instructions", async () => {
    const { Keypair } = await loadWeb3TestTools();
    const payer = Keypair.generate().publicKey;
    const recipient = Keypair.generate().publicKey;
    const prepared = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });
    const signedWithExtraTransfer = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1,
      includeExtraTransfer: true
    });

    expect(legacyTransactionMessageMatchesPreparedAction(
      signedWithExtraTransfer,
      serializeLegacyVersionedMessage(prepared)
    )).toBe(false);
    expect(getLegacyTransactionMessageMismatchReasons(
      signedWithExtraTransfer,
      serializeLegacyVersionedMessage(prepared)
    )).toEqual(["compiledInstructions"]);
  });
});

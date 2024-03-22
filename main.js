import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import mainCircuit from "./circuits/main.json" assert { type: "json" };
import recursionCircuit from "./circuits/recursion.json" assert { type: "json" };

async function main() {
	// setup backends for main and recursive proofs
	const mainBackend = new BarretenbergBackend(mainCircuit, { threads: 8 });
	const recursionBackend = new BarretenbergBackend(recursionCircuit, {
		threads: 8,
	});
	const noirMain = new Noir(mainCircuit, mainBackend);
	const noirRecursive = new Noir(recursionCircuit, recursionBackend);

	const inputs = {
		x: 1,
		y: 2,
	};

	const { proof, publicInputs } = await noirMain.generateProof(inputs);
	const { proofAsFields, vkAsFields, vkHash } =
		await mainBackend.generateRecursiveProofArtifacts(
			{ publicInputs, proof },
			1
		);
	const recursiveInputs = {
		verification_key: vkAsFields.map((e) => e.toString()),
		proof: proofAsFields,
		public_inputs: publicInputs,
		key_hash: vkHash,
	};

	// doesn't work
	const { recursiveWitness } = await noirRecursive.execute(recursiveInputs);
	const finalProofData = await recursionBackend.generateProof(
		recursiveWitness
	);

	// // works
	// const finalProofData = await noirRecursive.generateProof(recursiveInputs);

	console.log(finalProofData);
	process.exit(0);
}

main().catch(console.error);

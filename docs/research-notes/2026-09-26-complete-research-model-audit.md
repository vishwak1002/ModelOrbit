# Complete research model audit — 2026-09-26

## Scope and method

I read all 25 files recursively under `data/research`: the inventory and its README, the remote README, 11 remote JSON snapshots, and their 11 Markdown reports. The Markdown reports contain no Hugging Face model IDs absent from the JSON/inventory. The snapshots contain **95 distinct Hugging Face IDs at 100 ID/revision pairs**. The inventory adds **18 distinct IDs**, 14 with a recorded revision and four without one; no inventory ID occurs in the snapshot set. In total the research tree names **113 IDs / 118 record pairs**. The full ID/revision index is below.

A collector `mobileSignals` tag or the three-item popularity shortlist is a discovery lead, not evidence that a particular artifact runs on both phones. I use three distinct claims: **source-model path** (export the named upstream checkpoint), **published mobile artifact** (a separate repository containing device formats), and **measured native inference** (requires an actual device run). A published artifact is not automatically proof of its upstream checkpoint revision. No ModelOrbit device benchmark was found in the research tree.

## Source checkpoints with direct two-platform paths

| Source checkpoint | iPhone evidence | Android evidence | Research/device result |
| --- | --- | --- | --- |
| `Qwen/Qwen3-0.6B@a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143` | [Apple Qwen3 Core AI recipe](https://github.com/apple/coreai-models/blob/main/models/qwen3/README.md) | [PyTorch Qwen3 ExecuTorch recipe](https://github.com/pytorch/executorch/blob/main/examples/models/qwen3/README.md) | Already in verified inventory and both device manifests; asset export and device inference unmeasured. |
| `Qwen/Qwen3-1.7B@70d244cc86ccca08cf5af4e1e306ecf908b1ad5e` | Same Apple recipe | Same PyTorch recipe | Already in verified inventory and both manifests; device inference unmeasured. |
| `Qwen/Qwen3-4B@1cfa9a7208912126459214e8b04321603b3df60c` | Same Apple recipe | Same PyTorch recipe | Already in verified inventory and both manifests; device feasibility may depend on memory and quantization; unmeasured. |
| `nvidia/parakeet-tdt-0.6b-v3@541d1f99c6b0c3cd0b11a95167540bb8edefd82b` | [Apple Parakeet export](https://github.com/apple/coreai-models/blob/main/models/parakeet/export.py) | [PyTorch Parakeet mobile recipe](https://github.com/pytorch/executorch/blob/main/examples/models/parakeet/README.md) | Already in verified inventory and both manifests; Android app needs a custom JNI AAR; inference unmeasured. |
| `HuggingFaceTB/SmolLM2-135M-Instruct@12fd25f77366fa6b3b4b768ec3050bf629380bac` | [Apple SmolLM2 Core AI recipe](https://github.com/apple/coreai-models/blob/main/models/smollm2/README.md); alternatively XNNPACK on iPhone | [Optimum ExecuTorch's exact Instruct export command and iOS/Android handoff](https://github.com/huggingface/optimum-executorch#quick-start) | **New admission.** At audit start, the inventory called it `claimed-but-unverified` because it cited an unrelated base-model `.pte`; the Optimum recipe removes that exact-ID objection. The recorded revision is now pinned in both device manifests and native adapter routes. No inference result is implied. |
| `meta-llama/Llama-3.2-1B-Instruct@9213176726f574b556790deb65791e0c5aa438b6` | [PyTorch Llama 3.2 phone enablement and Instruct export](https://github.com/pytorch/executorch/blob/main/examples/models/llama/README.md) | Same PyTorch recipe | **New source-export admission.** The [pinned Hub revision](https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct/tree/9213176726f574b556790deb65791e0c5aa438b6/original) contains the recipe's `consolidated.00.pth`, `params.json`, and `tokenizer.model`. PyTorch reports Llama 3.2 1B/3B tests on iPhone 15 Pro/Pro Max and Android phones and explicitly permits Instruct checkpoints for chat. Both device projects now carry this pinned model and native adapter routes. Do not transfer PyTorch's measurements to ModelOrbit. |

The Optimum README directly names `HuggingFaceTB/SmolLM2-135M-Instruct` in its XNNPACK CLI command and directs the exported model to ExecuTorch iOS/Android sample apps. The README command itself follows the mutable Hub default, so a ModelOrbit recipe must resolve/pin `12fd25f77366fa6b3b4b768ec3050bf629380bac` before conversion. Its [SmolLM integration tests](https://github.com/huggingface/optimum-executorch/blob/main/tests/models/test_modeling_smollm.py) separately test the *base* `HuggingFaceTB/SmolLM2-135M`; do not cite those tests as an Instruct test.

## Additional published device artifacts and family paths

The seven snapshot repositories `software-mansion/react-native-executorch-{gemma-4,hammer-2.1,llama-3.2,phi-4-mini,qwen-2.5,qwen-3,smolLm-2}` are multi-variant exported-artifact **containers**, not seven single upstream checkpoints. [React Native ExecuTorch's official documentation](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation) describes ready-made models and XNNPACK/MLX variants, and its [package README](https://github.com/software-mansion/react-native-executorch) documents iOS 17+ and Android 13+ support. Their [model cards](https://huggingface.co/software-mansion/react-native-executorch-smolLm-2) and [source registry](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) provide `.pte` file paths. **These snapshot IDs warrant a platform-artifact registry lane after selecting a specific variant and pinned export/runtime version.** They do not prove that any *original* inventory revision, such as `microsoft/Phi-4-mini-instruct@cfbefacb99257ffa30c83adab238a50856ac3083`, produced those files. The old Phi exclusion applies only to Apple's Core AI lane; it must not be treated as a universal iPhone prohibition.

| Published artifact container from snapshots | Latest observed immutable repository revision | Variant decision |
| --- | --- | --- |
| [`software-mansion/react-native-executorch-gemma-4`](https://huggingface.co/software-mansion/react-native-executorch-gemma-4) | `e20831dd07f0f0d2bb6ee85e204e974a8a69b903` | E2B `.pte` files for MLX, Vulkan and XNNPACK; Gemma license and ~2.4–2.7 GB artifact sizes need explicit treatment. |
| [`software-mansion/react-native-executorch-hammer-2.1`](https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1) | `c4199705378c028f677edea3f8efccb9a4252d46` | 0.5B/1.5B/3B files; CC-BY-NC-4.0 license limits use. |
| [`software-mansion/react-native-executorch-llama-3.2`](https://huggingface.co/software-mansion/react-native-executorch-llama-3.2) | `79216107364ad9dcad8df0c24a2165aaa9c5cbda` | 1B/3B BF16, SpinQuant and MLX exports; Llama 3.2 license. |
| [`software-mansion/react-native-executorch-phi-4-mini`](https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini) | `e1d400b8ab567a037ea9661cdb92b9151699c140` | One 3.8B model with XNNPACK and MLX exports; large memory/storage cost. |
| [`software-mansion/react-native-executorch-qwen-2.5`](https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5) | `317a0eac7f04d9c83fdf17e5a5a3fc615350d0ec` | 0.5B/1.5B/3B variants; choose exact file path before registry admission. |
| [`software-mansion/react-native-executorch-qwen-3`](https://huggingface.co/software-mansion/react-native-executorch-qwen-3) | `5004436bc2c31aeaeb272a1ea6e47bd7d91da95c` | 0.6B/1.7B/4B exports; deduplicate against existing source checkpoint entries. |
| [`software-mansion/react-native-executorch-smolLm-2`](https://huggingface.co/software-mansion/react-native-executorch-smolLm-2) | `ca256eec04136b82507d78d08e22a95ddd9172d2` | 135M/360M/1.7B exports; source Instruct revision lineage remains separate. |

The [Gemma 4 card](https://huggingface.co/software-mansion/react-native-executorch-gemma-4) and [Hammer 2.1 card](https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1) explicitly list their native backend artifacts and ExecuTorch v1.4.1 compatibility; other cards likewise identify a particular runtime version. Prefer a concrete `repo@revision/path/to/model.pte` entry over a container ID alone.

The existing inventory's `sentence-transformers/all-MiniLM-L6-v2` exclusion is a *generative-LLM scope* exclusion. [React Native ExecuTorch's model registry](https://docs.swmansion.com/react-native-executorch/docs/next/utilities/model-registry) names `text_embedding.all_minilm_l6_v2` for its mobile runtime. The [first-party exported-artifact card](https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2) names the upstream ID and publishes Core ML, Vulkan, and XNNPACK `.pte` variants with tokenizer files for ExecuTorch v1.4.1, but **does not name the upstream source revision**. Thus embedding is a real two-platform family/artifact path, but resolving the upstream repository's current SHA would not prove lineage to the published `.pte`. Pin a separate artifact repo revision and variant path for an artifact entry; prove source SHA during a controlled export before exact-source admission.

PaddleOCR's [iOS deployment guide](https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version3.x/inference_deployment/cross_platform/ios_deployment.en.md) has a complete on-device ONNX Runtime sample with a `PP-OCRv5_mobile` detection+recognition preset. Its [Android deployment guide](https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version3.x/inference_deployment/cross_platform/android_deployment.en.md) links the first-party [`PP-OCRv5_mobile_det_onnx`](https://huggingface.co/PaddlePaddle/PP-OCRv5_mobile_det_onnx) and [`PP-OCRv5_mobile_rec_onnx`](https://huggingface.co/PaddlePaddle/PP-OCRv5_mobile_rec_onnx) repositories as Android assets. The [iOS fetch script](https://github.com/PaddlePaddle/PaddleOCR/blob/main/deploy/ios_demo/scripts/fetch_ios_demo_models.sh) instead obtains bundles from `paddle-model-ecology.bj.bcebos.com`; no byte identity or revision mapping to those exact Hub repositories was established. Thus **the PP-OCRv5 mobile family is feasible on both phones**, while the exact remote-snapshot source repos `PaddlePaddle/PP-OCRv5_mobile_det@0d63e78e2b...` and `PP-OCRv5_mobile_rec@682f20538d...` are *not* yet an exact two-platform revision match. The ONNX repositories are distinct IDs absent from the snapshots and should be recorded with full immutable SHAs before admission. The English-specific `en_PP-OCRv5_mobile_rec` is a language variant, not the official demo's default recognizer. See the first-party [model card](https://huggingface.co/PaddlePaddle/en_PP-OCRv5_mobile_rec_onnx) for its separate ONNX artifact.

## Disputed and blocked cohorts

| Cohort in research tree | Disposition and missing proof |
| --- | --- |
| `Qwen/Qwen3-VL-2B-Instruct` | iPhone exporter is not a demonstrated phone runtime, while [Optimum export](https://github.com/huggingface/optimum-executorch/pull/214) and [ExecuTorch full runner](https://github.com/pytorch/executorch/pull/17572) remain upstream PR work. Not admitted. |
| `openai/whisper-large-v3-turbo` | [Apple export](https://github.com/apple/coreai-models/tree/main/models/whisper) is not complete native transcription; [Android example](https://github.com/meta-pytorch/executorch-examples/tree/main/whisper/android/WhisperApp) requires a custom/unreleased ASR AAR. [WhisperKit](https://github.com/argmaxinc/argmax-oss-swift) supports iPhone Whisper-family inference, but exact source revision lineage is not recorded. Keep experimental. |
| `HuggingFaceTB/SmolLM2-360M-Instruct`, `HuggingFaceTB/SmolLM2-1.7B-Instruct`, `Qwen/Qwen2.5-1.5B-Instruct`, `microsoft/Phi-4-mini-instruct` | Source families have Apple/ExecuTorch or Software Mansion paths. The cited official export examples do not tie both phones to these **exact inventory source revisions**. Re-review via pinned export/lineage; do not equate a base repo, Instruct repo, or re-export container. [Optimum's model list](https://github.com/huggingface/optimum-executorch#supported-models) is family-wide; its [Qwen2.5 test](https://github.com/huggingface/optimum-executorch/blob/main/tests/models/test_modeling_qwen2.py) uses the 0.5B base model. The [Phi-4-mini recipe](https://github.com/pytorch/executorch/blob/main/examples/models/phi_4_mini/README.md) names the exact Instruct ID but says its C++ runner tokenizer is still in progress, showing Python pybindings instead. |
| PaddleOCR v3/v4/v5 language variants, v5 server, v6 medium; GLM-OCR, Falcon-OCR, manga OCR | A mobile or OCR tag alone does not prove the recorded exact revision, preprocessing, and decoder work in both native app projects. The v5 mobile family has the strongest follow-up recipe above. |
| MobileLLM/MobileMoE/MobileVLM, LFM2.5, Qwen3.5, GGUF, CoreML-only and ExecuTorch-only exports | Names and single-platform artifacts are leads. Require matching iPhone+Android runtime, exact variant file, tokenizer/processors, license and revision. An MLX/macOS export alone is not iPhone evidence. |
| AST audio classifiers, wav2vec2/deepfake/emotion classifiers, Granite/Nemotron/SpeechT5 speech, remaining audio leads | No two-platform recipe for the recorded exact checkpoint was established in these snapshots. [Optimum ExecuTorch](https://github.com/huggingface/optimum-executorch#supported-models) lists some audio families, but that is not exact mobile transcription/classification evidence for all listed IDs. |

The remote snapshots contain `reddit-localllama-mobile` and `bluesky-mobile-llm` source errors on 2026-09-26; absence from those feeds is not negative evidence about model capability. The snapshot shortlist repeats `MIT/ast-finetuned-audioset-10-10-0.4593`, `zai-org/GLM-OCR`, and `kha-white/manga-ocr-base` from September 17 onward. That repetition reflects the collector's discovery heuristic, not a native feasibility decision.

## Gap versus device manifests at audit start

Both `devices/ios/model-pocs.json` and `devices/android/model-pocs.json` include the four originally verified source revisions, plus experimental Whisper. iOS lists experimental Qwen3-VL; Android records Qwen3-VL as blocked. **`HuggingFaceTB/SmolLM2-135M-Instruct@12fd25f` and `meta-llama/Llama-3.2-1B-Instruct@921317...` are direct source-revision gaps in both manifests.** The two-platform PaddleOCR v5 family and the Software Mansion multi-model export containers require separate artifact identities and variant entries before they can be represented honestly as exact models. No weight, conversion result, or phone result is asserted here.

## Complete model ID/revision index

`remote` means a Hugging Face lead observed in at least one remote JSON snapshot; `inventory` means an original inventory record. `—` means the inventory did not capture an immutable revision. For remote entries the full SHA is retained from the snapshot; multiple rows for one ID indicate a changed repository revision, not an extra distinct model.

| Origin | Hugging Face model ID | Recorded revision |
| --- | --- | --- |
| remote | `andrijdavid/MobileLLaMA-1.4B-Base-GGUF` | `c9e04c8cca5d51e938cac5bbdcce5238129330e8` |
| remote | `anziank/grio-gemma-3-1b-coreml-anyLM-seq2048` | `876a4708b2d134a9c1cc1153d126eba5076f9fb8` |
| remote | `anziank/grio-qwen2.5-0.5b-coreml-anyLM-seq512` | `62fd3cf37d98976b6ed9a044b21e4d8c2d8ffe22` |
| remote | `anziank/grio-qwen2.5-1.5b-instruct-coreml-stateful-int8` | `a9442469f80fc807d5f2e3a138a69fb023f9f7d7` |
| inventory | `apple/OpenELM-270M-Instruct` | `1096244b62a03bedc770f8521512fd071f3aa5fd` |
| remote | `Arm/smollm2-360m-instruct-8da4w-xnnpack-executorch` | `e36c98bfbd25e4803264fe7bdd69f45a9b39de49` |
| remote | `aufklarer/Qwen3-0.6B-Chat-CoreML` | `a92923a0a3624025a81cd485e9dedbbb23c2586b` |
| remote | `DevQuasar/facebook.MobileLLM-1.5B-GGUF` | `4b2ad8b953cecc29b164cbba69a169da0f08b9d4` |
| remote | `DevQuasar/facebook.MobileLLM-R1-140M-base-GGUF` | `7285750785792209bd9d7727b0bb0bed97253c26` |
| remote | `DevQuasar/facebook.MobileLLM-R1-140M-GGUF` | `fa603226774f8891f78c50668591292433c1cc9e` |
| remote | `DevQuasar/facebook.MobileLLM-R1-360M-base-GGUF` | `0e3a0b14c7780c2352695fc7e5ac748aedc2701b` |
| remote | `DevQuasar/facebook.MobileLLM-R1-360M-GGUF` | `6df20c38c5618004ad9985784d9dfb1a7d134133` |
| remote | `DevQuasar/facebook.MobileLLM-R1-950M-base-GGUF` | `412f678fb34ce74e69af3a68a32ca007a163cc4e` |
| remote | `DevQuasar/facebook.MobileLLM-R1-950M-GGUF` | `8ebb371e042b45eeb9407d7c5917bbeae0391c96` |
| remote | `dispatchAI/Gemma-2B-Arabic-mobile` | `add211833c1c7b2972b99764ca778af7658ece0d` |
| remote | `dispatchAI/Qwen2.5-1.5B-Instruct-mobile-int4` | `f42c93eb5ab37f33b662c23142fe33e3ebd1ef82` |
| remote | `dispatchAI/Qwen2.5-Coder-7B-mobile` | `0b771232aedd3665a46114c9dac772cdd2979769` |
| remote | `enterprise-explorers/Llama-2-7b-chat-coreml` | `eaf97358a37d03fd48e5a87d15aff2e8423c1afb` |
| inventory | `executorch-community/SmolLM2-135M` | `—` |
| remote | `experimentalmachines/LFM2.5-2.6B-ExecuTorch` | `357371c58949de3c1dc30489812fa6860e93544b` |
| remote | `experimentalmachines/LFM2.5-2.6B-ExecuTorch` | `71883f31ae285a65611c730f1551f444492eb242` |
| remote | `experimentalmachines/LFM2.5-2.6B-ExecuTorch` | `d661b4c17092530e7c31586360b318e84be69ed3` |
| remote | `experimentalmachines/Qwen2.5-0.5B-ExecuTorch` | `2aa678411830dcbe460bdb6b788c216c892b8233` |
| remote | `experimentalmachines/Qwen3-0.6B-ExecuTorch` | `f873935d125167e13482b0cc51e57d80e5f335e2` |
| remote | `experimentalmachines/Qwen3-4B-ExecuTorch` | `3b74f69e91b8fd9f6cd74516b27d4511540a1618` |
| remote | `experimentalmachines/SmolLM2-135M-ExecuTorch` | `ac9a47e1e442b44000d1a80239825689bf6fc255` |
| remote | `experimentalmachines/SmolLM2-135M-Instruct-ExecuTorch` | `4cd2b22cdc98aa6f9af45cba049ce6d35ecd16fd` |
| remote | `experimentalmachines/SmolLM2-135M-Instruct-ExecuTorch` | `4fa535d4e735db3c0aa57e3c29fbf26be82ac3b3` |
| remote | `experimentalmachines/SmolLM2-360M-Instruct-ExecuTorch` | `4c5b78b5f9ff29a9529e2211066ac62ec6e4f845` |
| remote | `facebook/audiobox-aesthetics` | `9b1dd8e5df9af7216e836a98974fe3b82c56ded6` |
| remote | `facebook/MobileLLM-125M` | `f6820a829b347aaa6674a705c82be3db47b1f9ee` |
| remote | `facebook/MobileLLM-Pro-base` | `de68400a83061403d662e79464b4d818586b7b66` |
| remote | `facebook/MobileLLM-R1-140M` | `df21db6bd739b9b82c2caf2647b724ed63b8521e` |
| remote | `facebook/MobileLLM-R1-140M-base` | `27cb0e3b88e117559000732d26d3b08d0339cf7e` |
| remote | `facebook/MobileLLM-R1-950M` | `aa7d61df54d764738d32c220e107ed5f292d56eb` |
| remote | `facebook/MobileMoE-M-Base` | `f231740144b18f980fc1d7cce0ba60eb6f08b446` |
| remote | `facebook/MobileMoE-S-Base` | `23b6f610d688b3448705d2027ae716da0bb40d72` |
| remote | `facebook/MobileMoE-S-QAT` | `afda132cad380ac47da5ef055f186884d1c12f65` |
| remote | `facebook/MobileMoE-S-SFT` | `4decae01abfeaf46046b8774fdc4404b3e33a3a4` |
| inventory | `google/gemma-3-4b-it` | `—` |
| remote | `Gustking/wav2vec2-large-xlsr-deepfake-audio-classification` | `f7050b586236dc910d1157f430def2d0647b02b4` |
| remote | `handy-computer/granite-4.0-1b-speech-gguf` | `9f243e662e448e8bcc64c3b1195413e106002334` |
| remote | `handy-computer/granite-speech-4.1-2b-gguf` | `8636dae5eebb011a3d9b56215944ed0925a0d035` |
| remote | `handy-computer/granite-speech-4.1-2b-plus-gguf` | `fc98d5c650f77eaa6210f0d70aac73c3c567f38c` |
| inventory | `HuggingFaceTB/SmolLM2-1.7B-Instruct` | `31b70e2` |
| inventory | `HuggingFaceTB/SmolLM2-135M-Instruct` | `12fd25f77366fa6b3b4b768ec3050bf629380bac` |
| inventory | `HuggingFaceTB/SmolLM2-360M-Instruct` | `a10cc15` |
| remote | `ibm-granite/granite-4.0-1b-speech` | `bd87ab862416353633ea431fe49b1614003623c5` |
| remote | `ibm-granite/granite-speech-3.2-8b` | `d5835026ead54ba48927de4f6ed12b67848444f3` |
| remote | `ibm-granite/granite-speech-3.3-2b` | `4ac2f02f413c6169ae8c0ccc217115a366e552d7` |
| remote | `ibm-granite/granite-speech-3.3-8b` | `5670dcfae4a296e6993ac53eb25f638c6aaa54d0` |
| remote | `ibm-granite/granite-speech-4.1-2b` | `de575db64086f84fdc79da4932d1076e965bc546` |
| remote | `ibm-granite/granite-speech-4.1-2b-plus` | `1454e6e1e33845ca9280ff65f52cf1141ba6e6e2` |
| remote | `ibm-granite/granite-speech-5.0-470m-turboctc` | `286456107c8ba1161f5c22dfe85466402c88333b` |
| remote | `ibm-granite/granite-speech-5.0-470m-turboctc` | `7b65966a5d45b4da0cfa04879c1972dcbaaeae17` |
| remote | `kha-white/manga-ocr-base` | `aa6573bd10b0d446cbf622e29c3e084914df9741` |
| remote | `litert-community/functiongemma-270m-ft-mobile-actions` | `f752a74080682b379823794defdbbdf8c2663609` |
| remote | `m3hrdadfi/wav2vec2-xlsr-persian-speech-emotion-recognition` | `a71bf01ccb1cfc182c37550938d78c958f18a5eb` |
| inventory | `meta-llama/Llama-3.2-1B-Instruct` | `9213176726f574b556790deb65791e0c5aa438b6` |
| inventory | `microsoft/Phi-4-mini-instruct` | `cfbefacb99257ffa30c83adab238a50856ac3083` |
| remote | `microsoft/speecht5_asr` | `53615c10408485422e09a12cda191a747f4bbe34` |
| inventory | `mistralai/Mistral-7B-Instruct-v0.3` | `—` |
| remote | `MIT/ast-finetuned-audioset-10-10-0.4593` | `f826b80d28226b62986cc218e5cec390b1096902` |
| remote | `MIT/ast-finetuned-audioset-14-14-0.443` | `b11a9849b3fefcda0ca9111ba85bd923094db9b2` |
| remote | `mlboydaisuke/LFM2.5-1.2B-Instruct-ExecuTorch` | `854961e479873b2975a811bda36879b6ae4bb4c0` |
| remote | `mlboydaisuke/LFM2.5-350M-ExecuTorch` | `904b1170a851d9ba471b865aabd6ca4f034012fe` |
| remote | `mlboydaisuke/qwen3.5-0.8B-CoreML` | `82700f499b705c64c594c42deff684ec0321bcce` |
| remote | `mlboydaisuke/Qwen3.5-0.8B-ExecuTorch` | `ce0255c2aa7c17887d98e6bdadaf01a89d74acae` |
| remote | `mlboydaisuke/qwen3.5-2B-CoreML` | `a5c0fe1d22f1bb00a19ff8e05d60d3fd07b30d74` |
| remote | `mlx-community/GLM-OCR-4bit` | `97f587506984cc92fa69b2694b4128e53db6b081` |
| remote | `mtgv/MobileLLaMA-1.4B-Base` | `c7d8472e1f5a83bbe51460a5ee610a2340077ca7` |
| remote | `mtgv/MobileLLaMA-1.4B-Chat` | `7073081bd6b02d97ac4f9c7e8167fd3c28483c1c` |
| remote | `mtgv/MobileVLM_V2-1.7B` | `9a5b623a83feae6a6b2ecad7a843334ccc119ce1` |
| remote | `mtgv/MobileVLM_V2-3B` | `a985787d31160f7f847cdb88a59e6954bbc421aa` |
| remote | `nvidia/nemotron-speech-streaming-en-0.6b` | `ebe59e5a817142986528bbbee5dba8db7b38ed50` |
| inventory | `nvidia/parakeet-tdt-0.6b-v3` | `541d1f99c6b0c3cd0b11a95167540bb8edefd82b` |
| inventory | `openai-community/gpt2` | `—` |
| inventory | `openai/whisper-large-v3-turbo` | `41f01f3fe87f28c78e2fbf8b568835947dd65ed9` |
| remote | `PaddlePaddle/en_PP-OCRv3_mobile_rec` | `321b476529616da79d896969cbd251198fb7a75b` |
| remote | `PaddlePaddle/en_PP-OCRv4_mobile_rec` | `f97b62fdc0eb71c689393a19a4b21baa1795c9ab` |
| remote | `PaddlePaddle/en_PP-OCRv5_mobile_rec` | `267c36e24c331595590fe7bd72bde2436fd286f2` |
| remote | `PaddlePaddle/eslav_PP-OCRv5_mobile_rec` | `7553801264d3379d8d2e854971989e5e26c22e03` |
| remote | `PaddlePaddle/korean_PP-OCRv5_mobile_rec` | `c02ecaf1f22bfd1c618cce154fd19185b47e663a` |
| remote | `PaddlePaddle/latin_PP-OCRv5_mobile_rec` | `ab2cd5cc5fa6309be2e5acdfe66eca2c2c127d57` |
| remote | `PaddlePaddle/PP-OCRv3_mobile_det` | `58f4e5b132e34e516486fb0d0266c662feb48ca1` |
| remote | `PaddlePaddle/PP-OCRv4_mobile_det` | `3cc09f3a5b424e8e010abc7a4271aea12999c2f7` |
| remote | `PaddlePaddle/PP-OCRv5_mobile_det` | `0d63e78e2b680928f6b1747d76a08db6e645efb7` |
| remote | `PaddlePaddle/PP-OCRv5_mobile_det_onnx` | `e6f4fa85f00e168c862bc462aebca69eef9b3d3d` |
| remote | `PaddlePaddle/PP-OCRv5_mobile_rec` | `682f20538d8c086cb2128e5cfac775e6c4904e85` |
| remote | `PaddlePaddle/PP-OCRv5_server_det` | `ca867c897ecbca8873081573a802ad70d499cb94` |
| remote | `PaddlePaddle/PP-OCRv5_server_rec` | `b26c3587fda8da3c8ec0ce357214b4d661ff1558` |
| remote | `PaddlePaddle/PP-OCRv6_medium_det` | `8e0f56fb2ef86b461d99cfc7ac5c137738985f61` |
| remote | `PaddlePaddle/PP-OCRv6_medium_det_onnx` | `61323801669c338b7891481ec7bac61ce31b576a` |
| remote | `PaddlePaddle/PP-OCRv6_medium_rec` | `e5a92bcbc5cc1b494628e458d267778f0704fd7c` |
| remote | `PaddlePaddle/PP-OCRv6_medium_rec_onnx` | `50c7eacafc52fa7bcf4194e8cd08e46f8558504b` |
| remote | `PaddlePaddle/PP-OCRv6_small_rec_onnx` | `b8f84f0b80c529de40b4fbb3544b84fa7233a513` |
| remote | `pyannote/overlapped-speech-detection` | `8f0b792aecbcd7b4c60c8454802057164b08e34b` |
| inventory | `Qwen/Qwen2.5-1.5B-Instruct` | `989aa79` |
| inventory | `Qwen/Qwen3-0.6B` | `a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143` |
| inventory | `Qwen/Qwen3-1.7B` | `70d244cc86ccca08cf5af4e1e306ecf908b1ad5e` |
| inventory | `Qwen/Qwen3-4B` | `1cfa9a7208912126459214e8b04321603b3df60c` |
| inventory | `Qwen/Qwen3-VL-2B-Instruct` | `89644892e4d85e24eaac8bacfd4f463576704203` |
| inventory | `sentence-transformers/all-MiniLM-L6-v2` | `1110a243fdf4706b3f48f1d95db1a4f5529b4d41` |
| remote | `smkrv/Qwen3-0.6B-CoreML-4bit` | `e136da1d48ee962fb3d3a6014143be43d38eb76c` |
| remote | `software-mansion/react-native-executorch-gemma-4` | `e20831dd07f0f0d2bb6ee85e204e974a8a69b903` |
| remote | `software-mansion/react-native-executorch-hammer-2.1` | `c4199705378c028f677edea3f8efccb9a4252d46` |
| remote | `software-mansion/react-native-executorch-llama-3.2` | `79216107364ad9dcad8df0c24a2165aaa9c5cbda` |
| remote | `software-mansion/react-native-executorch-phi-4-mini` | `e1d400b8ab567a037ea9661cdb92b9151699c140` |
| remote | `software-mansion/react-native-executorch-qwen-2.5` | `317a0eac7f04d9c83fdf17e5a5a3fc615350d0ec` |
| remote | `software-mansion/react-native-executorch-qwen-3` | `0049de4e78cdb61ac146db07e55f0d34a05529b7` |
| remote | `software-mansion/react-native-executorch-qwen-3` | `5004436bc2c31aeaeb272a1ea6e47bd7d91da95c` |
| remote | `software-mansion/react-native-executorch-smolLm-2` | `ca256eec04136b82507d78d08e22a95ddd9172d2` |
| remote | `tiiuae/Falcon-OCR` | `fe757d59ecd79d4d68760162306a70a015761ad9` |
| remote | `unsloth/GLM-OCR` | `fae39dc9c35655593e5f9f77e2b01276ad343b38` |
| remote | `Xenova/ast-finetuned-audioset-10-10-0.4593` | `249a1fbf0286b40e7f1ed687a8ae396997bf7dc6` |
| remote | `younghan-meta/LFM2.5-ExecuTorch-MLX` | `a40440e2f4a414f7143e56f80d3a0b54337ed82b` |
| remote | `zai-org/GLM-OCR` | `2e85a62840ccac27daa451df36c736c4636b8628` |
| remote | `zhangsq-nju/MobileLLM-350M-EdgeRazor-1.58bit` | `ca4cb5ad0122e20a1aeba834bac1b9fa211870c7` |

## Implementation handoff — 2026-09-26

The iOS and Android device projects now include source-pinned SmolLM2-135M-Instruct and Llama-3.2-1B-Instruct routes, local artifact layouts, and no-weight fixture paths. The registry has six source-verified cross-platform checkpoints. Phi-4-mini and all-MiniLM-L6-v2 remain `claimed-but-unverified`: their alternate mobile artifact paths are real leads, but source-revision lineage and exact variant validation are incomplete. The research prompt now requires implementations for every verified checkpoint and permits runtime paths beyond Core AI.

Host validation passed: 35 Node tests; repository, research, remote snapshot, registry, and device manifest validators; iOS and Android fixture smoke; mock POC; normalization; Swift syntax parse; Xcode project lint; shell syntax; and `git diff --check`. Research preflight reports 12 blocked rows for six verified models. The host has Xcode 26.4.1 while the iOS project targets iOS 27; Android SDK/adb and connected devices are unavailable. No pinned export, Xcode/Gradle native build, physical-phone inference, quality, memory, or latency measurement was performed.

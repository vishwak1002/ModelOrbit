# Android model assets

Do not commit model weights. For each candidate, create a directory containing:

```text
models/
  qwen3_0_6b/model.pte
  qwen3_0_6b/tokenizer.json
  qwen3_1_7b/model.pte
  qwen3_1_7b/tokenizer.json
  qwen3_4b/model.pte
  qwen3_4b/tokenizer.json
```

The `.pte` files must be exported with the same ExecuTorch release as the Gradle dependency and from the admitted Hugging Face revision. The tokenizer files come from the same revision. These files are ignored by Git.

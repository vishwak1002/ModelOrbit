# iOS Core AI model resources

Do not commit model weights. Export one candidate with Apple's `coreai-models` tools, then copy the complete exported resource folder here using one of these names:

```text
Models/
  qwen3_0_6b/
  qwen3_1_7b/
  qwen3_4b/
```

Each folder must include the `.aimodel` file and tokenizer/config resources produced by the export. The app picker selects the folder by name and the Swift adapter records the admitted Hugging Face revision.

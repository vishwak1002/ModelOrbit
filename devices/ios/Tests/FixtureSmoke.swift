import Foundation

@main
struct FixtureSmoke {
    static func main() async throws {
        let fixture = FixtureModelAdapter()
        let cases: [(ModelRecord, ModelInput)] = ModelCatalog.records.map { record in
            let input: ModelInput
            switch record.modality {
            case .textGeneration: input = .text("hello")
            case .speechToText: input = .audio(URL(fileURLWithPath: "/tmp/fixture.wav"))
            case .imageToText: input = .image(URL(fileURLWithPath: "/tmp/fixture.png"), prompt: "describe")
            }
            return (record, input)
        }
        precondition(cases.count == 8)
        precondition(cases.contains { record, _ in
            record.id == "HuggingFaceTB/SmolLM2-135M-Instruct" &&
            record.revision == "12fd25f77366fa6b3b4b768ec3050bf629380bac" &&
            record.modality == .textGeneration
        })
        precondition(cases.contains { record, _ in
            record.id == "meta-llama/Llama-3.2-1B-Instruct" &&
            record.revision == "9213176726f574b556790deb65791e0c5aa438b6" &&
            record.modality == .textGeneration
        })
        for (record, input) in cases {
            let result = try await fixture.run(input, model: record, resourceURL: nil)
            precondition(result.isFixture)
            precondition(result.text.contains(record.id))
            precondition(result.text.contains(record.revision))
        }
        print("iOS fixture smoke passed for \(cases.count) model records")
    }
}

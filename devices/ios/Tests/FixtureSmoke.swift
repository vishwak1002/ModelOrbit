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
        precondition(cases.count == 6)
        for (record, input) in cases {
            let result = try await fixture.run(input, model: record, resourceURL: nil)
            precondition(result.isFixture)
            precondition(result.text.contains(record.id))
            precondition(result.text.contains(record.revision))
        }
        print("iOS fixture smoke passed for \(cases.count) model records")
    }
}

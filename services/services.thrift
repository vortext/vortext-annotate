namespace java spa.services.services

include "structs.thrift"

exception ProcessException {
  1: i32 timestamp
  2: string what
  3: optional string why
}

service PDFParser {
        void ping(),
        // Calls the pdf parser to return, given a binary pdf (base64 encoded), the RawPDF
        structs.Document parse(1:string file)

        oneway void shutdown()
}

service Filter {
        void ping(),

        // Filters are elements of a pipeline.
        // They receieve a document and yield a different (modified) document
        structs.Document run(1:structs.Document document) throws (1:ProcessException error),

        oneway void shutdown()
}


service Echo {
        string echo(1:string input)
}
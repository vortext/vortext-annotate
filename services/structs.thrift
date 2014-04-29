namespace java spa.services.structs

struct Interval {
       1: required i32 upper;
       2: required i32 lower;
}

struct TextNode {
       1: i32 pageIndex;
       2: Interval interval;
}

struct MetaReference {
       1: string field;
       2: i32 idx;
}

struct Annotation {
       1: string uuid; // 128bit hex
       2: i32 label;
       3: MetaReference meta;
}

struct Marginalis {
       1: string id;
       2: string title;
       3: string description;
       4: list<Annotation> annotations;
}

struct Mapping {
       1: list<i32> textNodes;
       2: list<Interval> ranges;
}

struct Document {
       1: required string text;
       2: required list<TextNode> textNodes;
       3: optional list<Marginalis> marginalia;
       4: optional map<string, Mapping> meta;
}
export interface DebateSeed {
  title: string;
  slug: string;
  description: string;
  sideALabel: string;
  sideBLabel: string;
  status: "open" | "locked" | "archived";
  tags: string[];
  createdAt: Date;
  creatorIndex: number; // index into USER_SEEDS
}

export const DEBATE_SEEDS: DebateSeed[] = [
  // 1. Sola Scriptura
  {
    title: "Is Sola Scriptura Biblical?",
    slug: "is-sola-scriptura-biblical",
    description:
      "The doctrine of Sola Scriptura — that Scripture alone is the ultimate authority in matters of faith and practice — has been a cornerstone of Protestant theology since the Reformation. Proponents argue that the Bible itself claims sufficiency (2 Timothy 3:16-17), that the early church fathers appealed primarily to Scripture, and that church traditions have historically introduced errors that only biblical correction could address. They point to Christ's own rebukes of the Pharisees for elevating tradition over God's Word as a model for the church today.\n\nCritics, particularly within the Catholic and Orthodox traditions, contend that Sola Scriptura is itself unbiblical — a self-refuting doctrine nowhere explicitly taught in Scripture. They argue that the Bible emerged from the living tradition of the Church, that the canon itself was determined by ecclesial authority, and that passages like 2 Thessalonians 2:15 explicitly command believers to hold to both written and oral traditions. The proliferation of tens of thousands of Protestant denominations, they argue, demonstrates the practical failure of Scripture-alone interpretation.\n\nThis debate strikes at the heart of Christian epistemology: How do believers know what they know about God? Is Scripture a standalone, self-interpreting authority, or must it be read within the interpretive framework of Sacred Tradition and the Magisterium? Both sides bring substantial historical and exegetical evidence to the table.",
    sideALabel: "Scripture alone is the sufficient and final authority for Christian faith and practice",
    sideBLabel: "Scripture requires Sacred Tradition and Church authority for proper interpretation and completeness",
    status: "locked",
    tags: ["theology", "protestantism", "catholicism"],
    createdAt: new Date("2025-03-15T10:00:00Z"),
    creatorIndex: 0, // marcus_reformed (admin, platform founder)
  },

  // 2. Death Penalty
  {
    title: "Should Christians Support the Death Penalty?",
    slug: "should-christians-support-the-death-penalty",
    description:
      "The question of capital punishment has divided Christians for centuries. Those who affirm its legitimacy point to Genesis 9:6, where God establishes the principle that the one who sheds human blood shall have their blood shed, grounding the death penalty in the imago Dei itself. They cite Romans 13:1-4, where Paul describes the governing authority as God's servant who \"does not bear the sword in vain,\" and argue that justice for victims and the protection of society are moral imperatives rooted in biblical principles of righteousness.\n\nOpponents argue that the coming of Christ fundamentally transformed the ethics of retribution. They point to Jesus' intervention in the stoning of the adulterous woman (John 8:1-11), his command to love enemies and turn the other cheek (Matthew 5:38-48), and the consistent witness of the early church, which overwhelmingly opposed capital punishment for the first three centuries. They contend that a pro-life ethic must be consistently applied from conception to natural death, and that the irreversible nature of execution in a fallible justice system makes it morally unconscionable.\n\nThis debate also intersects with urgent contemporary concerns about racial disparities in sentencing, wrongful convictions exposed by DNA evidence, and whether the state's power over life and death can be wielded justly in a broken world. Christians on both sides must wrestle with how biblical justice, mercy, and human dignity relate to the power of the sword.",
    sideALabel: "The state has God-given authority to administer capital punishment for the gravest offenses",
    sideBLabel: "The ethic of Christ calls Christians to oppose the death penalty and advocate restorative justice",
    status: "open",
    tags: ["ethics", "politics", "justice"],
    createdAt: new Date("2025-04-20T14:00:00Z"),
    creatorIndex: 1, // sister_catherine (moderator)
  },

  // 3. Young Earth Creationism
  {
    title: "Is Young Earth Creationism Scientifically Viable?",
    slug: "is-young-earth-creationism-scientifically-viable",
    description:
      "Young Earth Creationism (YEC) holds that God created the universe in six literal 24-hour days approximately 6,000 to 10,000 years ago, as derived from a straightforward reading of the Genesis genealogies and creation narrative. Proponents argue that the Hebrew word \"yom\" in Genesis 1, when accompanied by a number and the phrase \"evening and morning,\" consistently means a literal day throughout Scripture. They point to organizations like Answers in Genesis and the Institute for Creation Research, which present scientific models — including catastrophic plate tectonics, accelerated nuclear decay, and flood geology — as viable alternatives to mainstream geological and cosmological timelines.\n\nCritics, including many evangelical scientists, argue that the overwhelming consensus across geology, astronomy, biology, and physics points to a universe approximately 13.8 billion years old and an Earth roughly 4.5 billion years old. They contend that YEC requires dismissing or reinterpreting vast bodies of evidence — from radiometric dating and the cosmic microwave background to the fossil record and genetic evidence — and that doing so undermines the credibility of Christian witness in the public square. Many old-earth Christians maintain that Genesis was never intended to be a scientific textbook and that its theological truths are fully compatible with an ancient universe.\n\nAt stake is not merely an academic question but a pastoral one: How should Christian communities engage with scientific inquiry? Does faithfulness to Scripture require adherence to a young earth, or does it allow — or even demand — integrating the findings of modern science into a robust theology of creation?",
    sideALabel: "A young earth is both biblically faithful and scientifically defensible",
    sideBLabel: "An ancient earth is scientifically established and compatible with biblical authority",
    status: "open",
    tags: ["science", "genesis", "creation"],
    createdAt: new Date("2025-05-05T09:30:00Z"),
    creatorIndex: 3, // dr_philosophy (trusted)
  },

  // 4. Was the Reformation Necessary?
  {
    title: "Was the Reformation Necessary?",
    slug: "was-the-reformation-necessary",
    description:
      "When Martin Luther nailed his Ninety-Five Theses to the door of the Wittenberg Castle Church in 1517, he set in motion a fracture in Western Christendom that endures to this day. Protestant historians argue that the Reformation was not merely necessary but providential — a recovery of the biblical gospel of justification by grace alone through faith alone, which had been obscured by centuries of accumulated traditions, the sale of indulgences, and a clerical system that mediated salvation through sacramental works. They point to the Council of Trent's subsequent anathemas against sola fide as confirmation that Rome had departed from apostolic teaching.\n\nCatholic and some ecumenically-minded scholars counter that the Reformation, however understandable as a reaction to genuine abuses, was ultimately a tragic and unnecessary schism. They argue that the Church had always possessed internal mechanisms for reform — as demonstrated by the Councils of Constance and Basel, the mendicant orders, and figures like Catherine of Siena — and that Luther's break destroyed the visible unity that Christ prayed for in John 17. The 1999 Joint Declaration on the Doctrine of Justification between Lutherans and Catholics, they note, demonstrated that the core theological dispute was largely a misunderstanding rooted in different terminological frameworks.\n\nThis debate invites participants to grapple with the deepest questions of ecclesiology: Is visible church unity essential to the gospel? Were the doctrinal issues at stake truly church-dividing, or could they have been resolved within the existing structures? And five centuries later, what responsibility do Protestants and Catholics bear toward healing the breach?",
    sideALabel: "The Reformation was a necessary recovery of the biblical gospel from serious doctrinal corruption",
    sideBLabel: "The Reformation was a tragic schism that could have been resolved through internal church reform",
    status: "locked",
    tags: ["church-history", "protestantism", "catholicism"],
    createdAt: new Date("2025-05-18T11:00:00Z"),
    creatorIndex: 5, // historian_ruth (trusted)
  },

  // 5. Women's Ordination
  {
    title: "Should Women Be Ordained as Pastors?",
    slug: "should-women-be-ordained-as-pastors",
    description:
      "Few issues in contemporary Christianity generate as much passionate disagreement as the question of women in pastoral ministry. Complementarians argue that Scripture establishes distinct and complementary roles for men and women in the church, citing 1 Timothy 2:12 (\"I do not permit a woman to teach or to exercise authority over a man\"), 1 Corinthians 14:34-35, and the pattern of exclusively male apostolic leadership. They contend that this reflects not cultural accommodation but a creational order rooted in the relationship between Christ and the Church (Ephesians 5:22-33), and that affirming women's equal dignity before God does not require identical roles.\n\nEgalitarians respond that these restrictive passages must be read in their specific historical context — addressing particular situations in Ephesus and Corinth — and that the broader trajectory of Scripture moves toward the full inclusion of women in every dimension of ministry. They point to Deborah as judge over Israel, Junia as an apostle (Romans 16:7), Phoebe as a deacon (Romans 16:1), Priscilla as a teacher of Apollos, and the prophesying daughters of Philip. Galatians 3:28, they argue, articulates the eschatological vision of the church where there is \"neither male nor female\" in Christ.\n\nBeyond the exegetical arguments, this debate raises hermeneutical questions of the first order: How do Christians distinguish between culturally bound instructions and timeless moral principles in the New Testament? What weight should church tradition carry when it appears to conflict with the trajectory of scriptural liberation? And how do our conclusions about gender and ministry reflect our deepest convictions about the character of God?",
    sideALabel: "Pastoral authority is reserved for qualified men as a matter of biblical complementarity",
    sideBLabel: "Women are called and gifted by God for all forms of ministry including pastoral ordination",
    status: "open",
    tags: ["ecclesiology", "gender", "ministry"],
    createdAt: new Date("2025-06-22T10:30:00Z"),
    creatorIndex: 2, // pastor_james (moderator)
  },

  // 6. Prosperity Gospel
  {
    title: "Is the Prosperity Gospel Compatible with Christianity?",
    slug: "is-the-prosperity-gospel-compatible-with-christianity",
    description:
      "The prosperity gospel — sometimes called the \"Word of Faith\" movement or \"health and wealth\" theology — teaches that God desires all believers to be physically healthy, materially wealthy, and personally successful, and that these blessings can be activated through faith, positive confession, and generous giving (particularly to one's ministry or church). Proponents cite Deuteronomic blessings (Deuteronomy 28), Jesus' promise of abundant life (John 10:10), and 3 John 1:2 as evidence that material prosperity is part of the atonement and God's will for every believer.\n\nCritics across the theological spectrum — from Reformed to Catholic to Anabaptist — argue that the prosperity gospel fundamentally distorts the Christian message by conflating the Kingdom of God with material success. They point to the overwhelming biblical witness of righteous suffering (Job, the prophets, Paul's catalog of afflictions in 2 Corinthians 11, the persecuted church in Revelation), Jesus' warnings about wealth (Mark 10:23-25, Luke 6:24), and the early church's voluntary poverty as evidence that prosperity theology inverts the gospel. The Lausanne Theology Working Group's 2010 statement called it \"a false gospel\" that \"is damaging to the church globally.\"\n\nThis debate carries enormous global significance. The prosperity gospel is one of the fastest-growing religious movements worldwide, particularly in sub-Saharan Africa, Latin America, and parts of Asia. Its critics worry that it exploits the poor, while its defenders argue that it empowers marginalized communities to claim God's promises. The theological stakes could not be higher: What exactly did Christ's atonement accomplish, and what should believers expect from God in this present age?",
    sideALabel: "God promises material blessing and physical health to those who exercise faith and generosity",
    sideBLabel: "The prosperity gospel distorts Scripture and exploits believers with false promises",
    status: "open",
    tags: ["theology", "prosperity", "gospel"],
    createdAt: new Date("2025-07-10T13:00:00Z"),
    creatorIndex: 12, // pentecostal_fire (established)
  },

  // 7. Civil Disobedience
  {
    title: "Should Christians Practice Civil Disobedience?",
    slug: "should-christians-practice-civil-disobedience",
    description:
      "The relationship between Christian faithfulness and political obedience has been contested since the apostles told the Sanhedrin, \"We must obey God rather than men\" (Acts 5:29). Christians who argue against civil disobedience emphasize Romans 13:1-7, where Paul instructs believers to submit to governing authorities as institutions ordained by God, and 1 Peter 2:13-17, which calls for submission \"for the Lord's sake\" even under the unjust rule of Nero. They argue that God works through established order, that political engagement through lawful channels is sufficient, and that disobedience risks anarchy and undermines the church's witness.\n\nAdvocates of civil disobedience draw on a rich tradition from the Hebrew midwives who defied Pharaoh (Exodus 1:17) to Daniel in the lions' den, from the early Christians who refused emperor worship to Dietrich Bonhoeffer's resistance to Nazism, from the Civil Rights movement led by Rev. Dr. Martin Luther King Jr. to contemporary acts of conscience. They argue that Romans 13 describes the proper function of government — to punish evil and reward good — and that when the state itself becomes an agent of injustice, obedience to God requires resistance. King's \"Letter from Birmingham Jail\" articulated the theological principle that \"an unjust law is no law at all,\" drawing on Augustine and Aquinas.\n\nThis debate is far from abstract. Christians today face questions about resistance to laws they consider unjust — from abortion and euthanasia policies to immigration enforcement, from religious liberty restrictions to environmental destruction. When, if ever, does faithfulness to Christ require breaking the law? And what forms of resistance — peaceful protest, tax refusal, sanctuary movements, direct action — are compatible with Christian witness?",
    sideALabel: "Christians are called to submit to governing authorities and work for change through lawful means",
    sideBLabel: "Faithfulness to God sometimes requires nonviolent resistance to unjust laws and systems",
    status: "open",
    tags: ["politics", "ethics", "government"],
    createdAt: new Date("2025-08-05T09:00:00Z"),
    creatorIndex: 14, // christian_lawyer (established)
  },

  // 8. Eternal Conscious Torment
  {
    title: "Is Eternal Conscious Torment the Biblical View of Hell?",
    slug: "is-eternal-conscious-torment-the-biblical-view-of-hell",
    description:
      "The traditional doctrine of hell as eternal conscious torment (ECT) — the belief that the unredeemed will experience unending suffering in a state of conscious awareness — has been the majority position in Christian theology for most of church history. Defenders of ECT point to Jesus' warnings about \"eternal fire\" (Matthew 25:41, 46), the \"unquenchable fire\" of Mark 9:43-48, the rich man's torment in Luke 16:19-31, and Revelation 14:11's description of smoke rising \"forever and ever.\" They argue that the infinite gravity of sin against an infinitely holy God warrants an infinite punishment, and that ECT has been affirmed by theologians from Augustine and Aquinas to Edwards and the Westminster Confession.\n\nConditional immortalists (annihilationists) contend that the biblical language of destruction, death, and perishing (Matthew 10:28, 2 Thessalonians 1:9, Romans 6:23) more naturally describes the permanent extinction of the wicked rather than their eternal preservation in suffering. They argue that the traditional view imports Greek philosophical assumptions about the inherent immortality of the soul into a biblical framework where immortality is a gift granted only to the redeemed (1 Corinthians 15:53-54). Figures from John Stott to Edward Fudge to the Rethinking Hell project have advanced this position as both biblically and morally superior.\n\nA third position — universal reconciliation or Christian universalism — holds that God's redemptive love will ultimately triumph over all resistance, and that passages like Colossians 1:19-20, 1 Timothy 2:4, and 1 Corinthians 15:22-28 point to the eventual restoration of all things. This debate touches the deepest questions of God's character: Is God primarily defined by justice or by love? Can a God of infinite goodness create beings destined for infinite suffering? And does the gospel's power have limits?",
    sideALabel: "Eternal conscious torment is the biblically warranted orthodox view of judgment",
    sideBLabel: "Conditional immortality or restoration better reflects Scripture on God's justice",
    status: "archived",
    tags: ["eschatology", "theology", "hell"],
    createdAt: new Date("2025-08-22T15:30:00Z"),
    creatorIndex: 7, // sola_gratia (established)
  },

  // 9. Evolution and Christianity
  {
    title: "Can Evolution and Christianity Be Reconciled?",
    slug: "can-evolution-and-christianity-be-reconciled",
    description:
      "Since Darwin published On the Origin of Species in 1859, Christians have debated whether evolutionary biology can be integrated with biblical faith. Theistic evolutionists — or \"evolutionary creationists,\" as organizations like BioLogos prefer — argue that God used evolutionary processes as the means of creation, that the scientific evidence for common descent is overwhelming, and that Genesis 1-3 was never intended as a scientific account but as a theological narrative about God's sovereignty, human dignity, and the reality of the Fall. They point to figures like B.B. Warfield, C.S. Lewis, and Pope John Paul II as evidence that evolutionary acceptance has deep roots in orthodox Christian thought.\n\nOpponents argue that evolution strikes at the foundations of Christian theology in ways that cannot be harmonized without significant doctrinal compromise. If humans evolved from prior hominid populations rather than being specially created as Adam and Eve, they ask, what becomes of the doctrine of original sin, the historicity of the Fall, and the typological relationship between Adam and Christ articulated by Paul in Romans 5:12-21 and 1 Corinthians 15:22? They contend that the mechanisms of evolution — random mutation, natural selection, millions of years of predation, suffering, and death before the Fall — are incompatible with the biblical portrayal of a \"very good\" creation marred only by human sin.\n\nThis debate extends beyond biology into philosophy and theology: Does evolutionary science undermine teleology and the argument from design? Can a Christian doctrine of humanity survive without a historical Adam? And how should the church navigate the tension between scientific consensus and theological conviction without either sacrificing intellectual integrity or surrendering core doctrinal commitments?",
    sideALabel: "Evolutionary creation is scientifically sound and fully compatible with orthodox Christian theology",
    sideBLabel: "Evolution undermines essential Christian doctrines and should be rejected on biblical grounds",
    status: "open",
    tags: ["science", "theology", "origins"],
    createdAt: new Date("2025-09-12T11:15:00Z"),
    creatorIndex: 24, // christian_scientist (new, but topically appropriate)
  },

  // 10. Sabbath Observance
  {
    title: "Should Christians Observe the Sabbath?",
    slug: "should-christians-observe-the-sabbath",
    description:
      "The Sabbath command — \"Remember the Sabbath day, to keep it holy\" (Exodus 20:8) — is one of the Ten Commandments, yet Christians have disagreed for centuries about whether and how it applies to New Covenant believers. Sabbatarians argue that the Sabbath is a creation ordinance established before the Fall (Genesis 2:2-3), embedded in the moral law, and never abrogated by Christ or the apostles. Some maintain Saturday observance (Seventh-day Adventists, Seventh Day Baptists), while others apply the Sabbath principle to Sunday as the Lord's Day (Westminster Confession, ch. 21), arguing that the resurrection transferred the day but not the obligation.\n\nThose who reject ongoing Sabbath obligation point to Paul's declaration in Colossians 2:16-17 that Sabbaths were \"a shadow of the things to come\" fulfilled in Christ, and to Romans 14:5-6, where he writes that \"one person esteems one day as better than another, while another esteems all days alike.\" They argue that the early church's shift to Sunday worship (Acts 20:7, 1 Corinthians 16:2, Revelation 1:10) was not a transfer of Sabbath law but a new practice celebrating the resurrection, and that Christians live in Sabbath rest permanently through faith in Christ (Hebrews 4:9-11).\n\nBeyond the exegetical debate lies a profound pastoral and cultural question: In an age of relentless productivity, digital connectivity, and burnout, does the Sabbath principle offer wisdom that the modern church ignores at its peril? Whether viewed as binding command or wisdom principle, the question of rest, worship, and the rhythm of sacred time speaks directly to how Christians understand their relationship to work, creation, and the God who rested on the seventh day.",
    sideALabel: "The Sabbath command remains binding on Christians as part of God's enduring moral law",
    sideBLabel: "Christians are free from Sabbath obligation and enter rest through faith in Christ",
    status: "open",
    tags: ["practice", "law", "sabbath"],
    createdAt: new Date("2025-10-08T08:45:00Z"),
    creatorIndex: 16, // messianic_ari (new)
  },

  // 11. Just War Theory
  {
    title: "Is Just War Theory Compatible with the Teachings of Jesus?",
    slug: "is-just-war-theory-compatible-with-the-teachings-of-jesus",
    description:
      "Just War Theory, developed by Augustine and refined by Aquinas and later Reformed and Catholic thinkers, holds that war can be morally justified under strict conditions: just cause, legitimate authority, right intention, proportionality, last resort, and reasonable chance of success. Its Christian proponents argue that love of neighbor sometimes requires the use of force to protect the innocent from aggression, that Romans 13 grants the state the authority of the sword, and that the entirety of the Old Testament narrative — from the conquest of Canaan to David's wars — demonstrates that God does not categorically oppose the use of lethal force in a fallen world.\n\nChristian pacifists — drawing from the Anabaptist, Quaker, and early church traditions — argue that the teachings of Jesus in the Sermon on the Mount represent a new ethic that supersedes Old Testament warfare provisions. \"Love your enemies\" (Matthew 5:44), \"do not resist the one who is evil\" (Matthew 5:39), and \"put your sword back in its place\" (Matthew 26:52) are not merely aspirational ideals but binding commands for the community that follows the crucified Messiah. They point out that the early church was overwhelmingly pacifist for nearly three centuries, and that Just War Theory only emerged after Constantine's co-optation of Christianity by imperial power.\n\nThis is not an abstract theological exercise. Christians serve in militaries around the world, work in defense industries, pay taxes that fund warfare, and vote for leaders who command armed forces. The debate forces believers to confront whether the Way of the Cross is compatible with the way of the sword, and whether a faith centered on a God who chose to die rather than kill can ever sanction lethal violence in his name.",
    sideALabel: "Just War Theory provides a faithful Christian framework for the legitimate use of force",
    sideBLabel: "The way of Jesus demands nonviolence, and Just War Theory compromises the gospel of peace",
    status: "open",
    tags: ["ethics", "pacifism", "war"],
    createdAt: new Date("2025-11-14T10:00:00Z"),
    creatorIndex: 13, // anabaptist_peace (established)
  },

  // 12. Calvinism vs. Arminianism
  {
    title: "Does the Bible Support Calvinism or Arminianism?",
    slug: "does-the-bible-support-calvinism-or-arminianism",
    description:
      "The soteriological debate between Calvinism and Arminianism has shaped Protestant theology for over four centuries. Calvinists, following the theology systematized at the Synod of Dort (1618-19), affirm the \"five points\" summarized by the TULIP acronym: Total depravity, Unconditional election, Limited (or definite) atonement, Irresistible grace, and Perseverance of the saints. They ground their position in passages like Ephesians 1:4-5 (chosen before the foundation of the world), Romans 9:10-21 (God's sovereign election of Jacob over Esau), John 6:44 (\"No one can come to me unless the Father draws him\"), and John 10:27-29 (the security of Christ's sheep). For Calvinists, the glory of God in salvation is preserved only when every aspect of redemption — from election to glorification — is understood as God's sovereign, monergistic work.\n\nArminians, following the Remonstrance of 1610 and the theology of Jacobus Arminius, affirm that God's grace is necessary for salvation but resistible, that election is conditional upon foreseen faith, that Christ died for all people (not only the elect), and that genuine believers can potentially forfeit their salvation through persistent, unrepentant apostasy. They appeal to passages like 1 Timothy 2:4 (God desires all to be saved), 2 Peter 3:9 (not wishing that any should perish), Hebrews 6:4-6 and 2 Peter 2:20-22 (warnings against falling away), and the universal scope of John 3:16. They argue that Calvinism's deterministic framework makes God the author of sin and renders human moral responsibility meaningless.\n\nBeyond the exegetical battlefield, this debate raises the most fundamental questions about God's character and the nature of salvation: Is God's sovereignty best expressed in meticulous determination or in sovereign self-limitation that makes genuine creaturely freedom possible? Does unconditional election glorify God's grace or impugn God's justice? And can the church hold these positions in charitable tension, or are the differences truly church-dividing?",
    sideALabel: "God's sovereign, unconditional election and irresistible grace are the clear teaching of Scripture",
    sideBLabel: "God's grace is resistible, election is conditional on foreseen faith, and human free will is real",
    status: "open",
    tags: ["soteriology", "calvinism", "arminianism"],
    createdAt: new Date("2026-01-15T14:30:00Z"),
    creatorIndex: 7, // sola_gratia (established, Reformed theologian)
  },
];
